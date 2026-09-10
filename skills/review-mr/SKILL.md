---
name: review-mr
description: Review someone else's GitLab merge request end to end. Explains what the MR does in plain language, finds defects, sends fresh subagents to refute each finding, drops nits, then posts the survivors as inline or MR-level comments after you approve each one. Use when the user says "review this MR", "review !1226", pastes an MR URL, or asks to review a colleague's branch.
---

# Review MR

You are the reviewer, not the author. The output is comments on someone else's merge request, so a wrong comment costs a colleague real time. The pipeline exists to make wrong comments expensive to produce and easy to kill.

Use `address-mr-feedback` instead when the MR is the user's own and other people commented on it. That is the inbound direction. This is outbound.

## Pipeline

```
0 Resolve -> 1 Explain -> 2 Find -> 2b Merge+cut -> 3 Refute -> 4 Filter -> 5 Draft -> 6 Approve -> 7 Post
```

Phases 1 and 6 are stops. Show the user the output and wait. Everything else runs through.

## 0. Resolve and set up

Get the MR IID from the argument, the URL, or the current branch (`glab mr view -F json`).

```bash
PROJECT=$(git remote get-url origin | sed -E 's#^.*gitlab\.com[:/]##; s#\.git$##' | sed 's#/#%2F#g')
IID=<iid>
mkdir -p /tmp/mr
glab api "projects/$PROJECT/merge_requests/$IID" > /tmp/mr/$IID.json
glab api --paginate "projects/$PROJECT/merge_requests/$IID/discussions?per_page=100" > /tmp/mr/$IID-discussions.json
```

Read `/tmp/mr/$IID.json` with the `Read` tool. No `jq`. You need `title`, `description`, `author`, `source_branch`, `target_branch`, and `diff_refs` (which holds `base_sha`, `start_sha`, `head_sha`, needed in phase 7).

Get the code on disk so subagents can trace callers and callees. Do not touch the user's working tree:

```bash
git fetch origin "refs/merge-requests/$IID/head:mr-$IID"
git worktree add /tmp/mr/wt-$IID mr-$IID
git -C /tmp/mr/wt-$IID diff "$(git merge-base origin/<target_branch> mr-$IID)"...mr-$IID > /tmp/mr/$IID.diff
```

Clean up at the end with `git worktree remove /tmp/mr/wt-$IID && git branch -D mr-$IID`.

Read the existing discussions. If a reviewer already raised a point, do not raise it again.

## 1. Explain the MR (stop)

Invoke the `explain` skill and produce a walkthrough for the user. This is not a summary of the diff. It is an explanation of the change, built from the problem up, with real values.

Cover, in this order:

1. **The problem this MR solves.** From the linked Jira ticket if there is one, and from the code. Not from the MR title.
2. **What it changes.** One sentence.
3. **How it works.** Walk the actual path a request or a row takes through the new code, with a concrete example carrying real values.
4. **What to watch.** The parts where the change could plausibly be wrong. This seeds phase 2, so be honest rather than diplomatic.

Look up the Jira ticket if the description references one. The spec is half of the review.

Stop here. Let the user read it and react. They may redirect the review before you spend agent time on it.

## 2. Find

Spawn **one subagent per axis, in parallel, each with its own context**, against
`/tmp/mr/$IID.diff` with the worktree as the working directory. One agent given
four axes reliably drops the one it finds least interesting: measured on a real
MR, reviewers told to weigh conventions alongside everything else missed a
verbatim `AGENTS.md` rule that a dedicated standards agent caught immediately.
Axes are cheap and they cover different regions, so run them all rather than
picking.

The first two come from the `code-review` skill; give each agent that axis and
nothing from the others:

- **Standards axis:** repo standards (`CLAUDE.md`, `AGENTS.md`, nearby code) plus the Fowler smell baseline.
- **Spec axis:** the Jira ticket or linked spec. Missing requirements, scope creep, requirements implemented wrongly.

Add two more this repo needs, because most real defects here are runtime or self-inflicted, not stylistic:

- **Behaviour axis:** null and empty handling, boundary values, error paths that swallow, tenant or environment scoping, N+1 queries, missing `await`, type assertions hiding a real mismatch.
- **Contradiction axis:** the MR as a system of claims that must agree. Compare every payload the code builds against the invariants the MR's own tests, gates and docs assert about it, and check any field computed *before* a later step that can still change what it describes. The author is blind to these by construction: each half matched their intent at the moment they wrote it.

  Worked example: a tool set `count: widgets.length`; a bounding step then trimmed `widgets`; the same MR shipped a conformance gate asserting `count === widgets.length`. All green, and the payload contradicted itself on the first record large enough to truncate.

Rank by contract surface, not by arithmetic. Code that only lists and shapes records still emits fields that must agree with each other, and that surface hides defects as readily as a calculation does.

Collect every finding with: file, line, claim, the failure it predicts, and the
axis that raised it. Do not rank yet. Do not write comment prose yet.

**Keep the axis on every finding through to the report, and never rank across
axes.** A low-severity standards nit and a low-severity spec gap are not the
same kind of thing, and merging them into one severity order buries whichever
axis is quieter that day. Expect the standards axis to carry the worst hit rate
of the four: the smell baseline generates volume, which is what phase 4 exists
to absorb.

## 2b. Merge and cut, before spending a single refuter

Four axes overlap heavily and the standards axis alone will hand you a pile of
style observations. Refuting all of it is the expensive mistake: a refuter is a
whole subagent, and a nit you were going to drop in phase 4 does not need one.

Do this by reading, in one pass, no subagents:

1. **Merge duplicates.** Same `file:line` and same mechanism from two axes is
   one finding, and the agreement is worth noting on it.
2. **Drop the pure-style findings now.** A naming, ordering, length or
   formatting observation that predicts no failure is unfalsifiable by
   inspection; it does not need an agent to confirm that. Apply phase 4's Gate
   B here and keep only the one-line named smells.
3. **Keep every finding that predicts a concrete failure**, however unlikely it
   looks. Those are what refuters are for.

Expect this to cut the list by roughly half. Report the count before and after
so the user can see what was dropped cheaply versus what was tested.

## 3. Refute (fresh subagents)

This is the phase that earns the skill. Findings written by a review pass are plausible by construction, which is exactly what makes them dangerous.

Spawn **one subagent per finding**, in parallel, each with no knowledge of the other findings and no knowledge of the review that produced this one. Give each agent:

- The worktree path `/tmp/mr/wt-$IID`.
- The claim, stated neutrally: file, line, and the predicted failure.
- This brief:

> Your job is to disprove this claim. Work in the worktree. Read the flagged lines, then trace outward: every callee the flagged code invokes, every caller that can reach it, the library behaviour it depends on, and the types or schemas that constrain its inputs. The evidence that settles this almost never lives in the flagged file.
>
> Return exactly one verdict:
> - `REPRODUCED` with concrete inputs or state that produce the failure, plus the `file:line` proving each step of the path.
> - `REFUTED` with the `file:line` that makes the failure impossible: a caller that guards it, a type that forbids it, a constant that cannot vary, an upstream that always advances.
> - `UNFALSIFIABLE` if there is no failure scenario to test, because the claim is about taste, readability, or a hypothetical future change.
>
> Default to `REFUTED` when you cannot construct a failure. "It would be safer to" is not a failure scenario. A severity label is not evidence.

Those three inputs are the whole brief. An agent also handed your hypotheses about where bugs live searches your hypothesis space instead of the code, which is how an author's blind spot survives its own review.

A `REFUTED` verdict that cites no `file:line` is invalid: rerun that refuter
rather than accept it. The two rules guard opposite failures. Default-to-REFUTED
stops the critic caving to a confident reviewer, which is the documented way
adversarial review goes wrong. The citation requirement stops it caving to
laziness instead.

**Verdict handling:**

| Verdict | Action |
|---|---|
| REPRODUCED | Survives to phase 4 |
| REFUTED | Dropped. Record the one-line reason. |
| UNFALSIFIABLE | Goes to the nit filter in phase 4 |

For any finding claiming a crash, hang, data loss, or security hole, run **three** refuters and drop it unless at least two return REPRODUCED. Cheap findings get one refuter.

**Budget.** Axes run in parallel, so four of them cost one agent's wall clock.
Refuters are where the bill lands. If phase 2b leaves more than about a dozen
findings, refute the ones that predict the worst failure first and tell the user
what you deferred, rather than spawning thirty agents and making them wait.

## 4. Filter nits

Two gates. A finding must pass one of them.

**Gate A: a trigger path today.**

Ask: what command, request, or event triggers this failure in the code as it exists right now?

If the answer needs a future change (someone adds an npm script, a config flag flips, a caller that does not exist yet passes the bad value), it is a latent footgun, not a defect. Drop it from the MR. Mention it to the user in the session summary instead.

This gate is not optional. A mechanism being real is not enough.

**Gate B: a one-line code smell.**

Keep an `UNFALSIFIABLE` finding only if both hold:

- It is a named smell from the baseline (mysterious name, duplicated code, primitive obsession, dead speculative generality), and
- The fix is a one-liner or a rename.

Anything requiring the author to restructure code is a design conversation, not an MR comment. Raise it verbally with the user, not on the MR.

Everything else is dropped. Report drops as one line each, grouped, so the user can audit your judgement cheaply.

## 5. Draft the comments

Invoke the `concise` skill. Every surviving finding becomes one comment.

Each comment states:

1. What goes wrong. The concrete broken state.
2. When. The input or sequence that triggers it.
3. What to do. A direction, or a straight question if you are unsure.

One to three sentences. No em dashes. No "consider". No severity emoji. No restating the diff. If you are not certain, ask a question rather than assert with a hedge.

Decide the anchor for each comment:

- **Inline** when the finding sits on a line the diff touched. Note the file, the line number in the new file, and whether the line is added, removed, or context.
- **MR-level** when the finding is about the change as a whole, about a file the diff did not touch, or about a missing requirement. Quote the `file:line` in the body so the author can still find it.

## 6. Approve (stop)

Show the user a table, then the full text of every draft comment. Do not post anything yet.

```markdown
## MR !<IID>: <title> by @<author>

Found <n> -> refuted <r> -> nits dropped <d> -> **posting <p>**

| # | File | Line | Anchor | Finding | Evidence |
|---|------|------|--------|---------|----------|
| 1 | `src/foo.ts` | 42 | inline | Upload writes to bucket root when name is under 3 chars | Reproduced: `parseBucketName` indexes `[2]`, `oss.ts:88` |
| 2 | - | - | MR-level | Ticket asks for the archive toggle, not implemented | Spec: TICKET-123 AC3 |

**Dropped (<r+d>)**
- Race in the parallel jest run: no trigger path, CI excludes `*.integration.test.ts` (`jest.config.js:14`)
- "Consider extracting this helper": unfalsifiable, taste claim
- Null cursor retry: refuted, `fetchPage` throws on a stale cursor first (`client.ts:203`)

**Comments to post**
...full text of each...
```

Ask which to post. Default is all of them. Accept edits to the wording before posting.

## 7. Post

Only after the user confirms.

**Inline comment.** GitLab needs the full position object as a JSON body. Do NOT use `-f "position[new_line]=..."`: glab sends those bracket keys flat, GitLab drops the position, and the note lands as a plain thread. The SHAs come from `diff_refs` in `/tmp/mr/$IID.json`:

```bash
cat > /tmp/mr/body.json <<JSON
{"body": "<comment text>",
 "position": {"position_type": "text",
   "base_sha": "<diff_refs.base_sha>", "start_sha": "<diff_refs.start_sha>", "head_sha": "<diff_refs.head_sha>",
   "new_path": "src/foo.ts", "old_path": "src/foo.ts", "new_line": 42}}
JSON
glab api --method POST "projects/$PROJECT/merge_requests/$IID/discussions" \
  -H "Content-Type: application/json" --input /tmp/mr/body.json
```

Verify the response's `notes[0].position.new_path` is set before moving on.

Which line fields to send:

| The line is | Send |
|---|---|
| Added (`+`) | `new_path`, `old_path`, `new_line` |
| Removed (`-`) | `new_path`, `old_path`, `old_line` |
| Unchanged context | `new_path`, `old_path`, both `new_line` and `old_line` |
| File was renamed | `old_path` is the pre-rename path |

**MR-level comment:**

```bash
glab mr note "$IID" -m "<comment text>"
```

**When an inline post fails.** GitLab returns 400 when the position does not match a line in the diff. Do not retry with a guessed line. Fall back to an MR-level note that opens with the location:

```
src/foo.ts:42 - upload writes to the bucket root when the name is under 3 characters.
```

Pause briefly between calls when posting several.

## Rules

- **Never resolve a thread.** You are the reviewer. The author resolves.
- **Never approve or merge** unless the user says so explicitly.
- **Never post without the phase 6 gate**, even when every finding is solid.
- **Do not comment on lines the MR did not change** unless the change breaks them. Say which changed line breaks it.
- **Do not repeat an existing comment.** You read the discussions in phase 0.
- **The MR's green tests are the author's belief, not proof.** A test written beside the code asserts what its author expected; a path those tests never execute is unread code, not covered code.
- **Being wrong toward fewer comments is cheap to fix. The reverse is not.**
- **Report what you dropped**, one line each. The user overrides your filter, not the other way round.
- Clean up the worktree and the local branch when the review is done.
