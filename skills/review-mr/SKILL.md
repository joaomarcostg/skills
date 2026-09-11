---
name: review-mr
description: Review someone else's GitLab merge request end to end. Explains what the MR does in plain language, then checks whether it does its job, what else it touches, and whether the code is decent. Refutes every finding with a fresh subagent, drops nits, gives a verdict, and posts the survivors as inline or MR-level comments after you approve each one. Use when the user says "review this MR", "review !1226", pastes an MR URL, or asks to review a colleague's branch.
---

# Review MR

You are the reviewer, not the author. The output is comments on someone else's merge request, so a wrong comment costs a colleague real time. The pipeline exists to make wrong comments expensive to produce and easy to kill.

Use `address-mr-feedback` instead when the MR is the user's own and other people commented on it. That is the inbound direction. This is outbound.

## The review this skill is trying to be

A good human reviewer asks three questions in order, and they are questions, not
techniques. A question terminates when it is answered. A technique does not:
"find code smells" has no stopping point, so an agent given one keeps going until
it runs out of budget and reports everything it passed on the way.

1. **Does it do what it is for?** For a fix, is the bug actually gone, and did the
   fix address the cause rather than the path the ticket happened to name.
2. **What else does it touch?** The blast radius. Other callers, sibling paths,
   cached state, the parts of the app that were working and might not be now.
3. **Is the code decent?** Reuse, duplication, simplification.

Questions 1 and 2 block approval. **Question 3 does not**, unless the code is
genuinely bad. Most quality findings are taste, and taste does not belong on
someone else's merge request.

The failure mode this structure exists to prevent: an agent that reviews
everything except the thing the MR is for, and buries the one real finding under
twenty preferences.

## Pipeline

```
0 Resolve -> 1 Explain+classify -> 2 Q1 intent -> 3 Q2 blast radius -> 4 Q3 quality
  -> 5 Merge+cut -> 6 Refute -> 7 Verdict+draft -> 8 Approve -> 9 Post
```

Phases 1 and 8 are stops. Show the user the output and wait. Everything else runs
through.

Phases 2, 3 and 4 run **in parallel**, despite being listed in order. The ordering
is for the verdict, not for execution: if Q1 fails, lead the report with it and
demote everything else, because a change that does not do its job makes blast
radius and quality noise. Serialising Q1 as a real gate costs six minutes of wall
clock to save one agent in the rare case it fails.

## 0. Resolve and set up

Get the MR IID from the argument, the URL, or the current branch (`glab mr view -F json`).

```bash
PROJECT=$(git remote get-url origin | sed -E 's#^.*gitlab\.com[:/]##; s#\.git$##' | sed 's#/#%2F#g')
IID=<iid>
mkdir -p /tmp/mr
glab api "projects/$PROJECT/merge_requests/$IID" > /tmp/mr/$IID.json
glab api --paginate "projects/$PROJECT/merge_requests/$IID/discussions?per_page=100" > /tmp/mr/$IID-discussions.json
```

Read `/tmp/mr/$IID.json` with the `Read` tool. No `jq`. You need `title`, `description`, `author`, `source_branch`, `target_branch`, and `diff_refs` (which holds `base_sha`, `start_sha`, `head_sha`, needed in phase 9).

Get the code on disk so subagents can trace callers and callees. Do not touch the user's working tree:

```bash
git fetch origin "refs/merge-requests/$IID/head:mr-$IID"
git worktree add /tmp/mr/wt-$IID mr-$IID
git -C /tmp/mr/wt-$IID diff "$(git merge-base origin/<target_branch> mr-$IID)"...mr-$IID > /tmp/mr/$IID.diff
```

**Clean up first, not just last.** An interrupted run leaves a worktree behind,
and the `git fetch` above then fails outright with "refusing to fetch into branch
checked out at ...". Run the teardown before the setup, ignoring failures, and
again at the end:

```bash
git worktree remove --force /tmp/mr/wt-$IID 2>/dev/null; git branch -D mr-$IID 2>/dev/null
```

**Check the diff you wrote is a real diff.** Some shells here proxy `git` through
a token-optimizing filter that rewrites output even into a redirect, producing a
summary with `... (N lines truncated)` markers instead of a unified diff. Hand
that to the find agents and they review lossy input without knowing. After
writing the file, confirm it starts with `diff --git`. If it does not, regenerate
through whatever bypass your proxy provides, then check again.

Read the existing discussions. If a reviewer already raised a point, do not raise it again.

## 1. Explain the MR (stop)

Invoke the `explain` skill and produce a walkthrough for the user. This is not a summary of the diff. It is an explanation of the change, built from the problem up, with real values.

Cover, in this order:

1. **The problem this MR solves.** From the linked Jira ticket if there is one, and from the code. Not from the MR title.
2. **What it changes.** One sentence.
3. **How it works.** Walk the actual path a request or a row takes through the new code, with a concrete example carrying real values.
4. **What to watch.** The parts where the change could plausibly be wrong. This seeds phase 2, so be honest rather than diplomatic.

Look up the Jira ticket if the description references one. The spec is half of the review.

### Classify the MR. It decides what question 1 means.

Take the type from the conventional-commit prefix and the ticket type together:
`fix(auth):` plus an issue tracker type of Bug is mechanical and reliable.
When they disagree, the code wins.

| Type | Question 1 becomes |
|---|---|
| **Fix** | Does the reported symptom stop, and does the fix address the actual cause rather than the path the ticket happened to name |
| **Feature** | Does it do what the intent says, and are the acceptance criteria met |
| **Refactor** | Is behaviour identical. That is the entire intent, so Q1 and Q2 largely merge and quality matters more than usual, since quality is the point |
| **Chore, deps, config** | Does it do the stated thing, and what breaks. Quality is nearly irrelevant |

**When there is no ticket**, say so in the verdict. Question 1 then means checking
the author's code against the author's own description, which is the author
marking their own homework. It is still worth doing and it is weaker, and the
person reading your review needs to know which of the two they are getting.

**Write the fact sheet before you stop.** Phase 1 makes you trace the plumbing the
change sits on. Save that trace to `/tmp/mr/$IID-facts.md` and hand it to every
agent in phases 2 and 3. Without it each agent re-derives the same chain from
scratch: measured on one MR, six of twelve agents independently re-traced the
same server-to-client error path, at roughly 40k tokens each.

The fact sheet carries only things that are true whether or not any finding is
true: the request path end to end with `file:line`, the global config defaults
the change depends on, library versions and the semantics that matter, and where
the user-visible effects (toasts, redirects, placeholders) are actually produced.

The test that keeps it honest: **if a line would read differently depending on
whether a finding turns out to be true, it is a hypothesis, not a fact. Cut it.**
Never list suspicions, never say where you think bugs are. An agent handed your
hypotheses searches your hypothesis space instead of the code, which is how an
author's blind spot survives its own review.

Stop here. Let the user read it and react. They may redirect the review before you spend agent time on it.

## 2. Question 1: does it do what it is for?

One subagent. It gets the ticket, the fact sheet, the diff and the worktree. Give
it the question its MR type earned in phase 1, and this:

> Do not review the code. Answer one question: does this change do the job it was
> written for?
>
> Start from the reported scenario, not from the diff. Reconstruct the exact path
> the bug took (or the path the feature promises), then walk it through the new
> code and say where the change intercepts it. Name the line.
>
> Then ask the harder half: **is the thing the fix intercepts actually the
> cause?** A fix can make a symptom disappear by handling it one layer below the
> real defect. Check what produces the reported state. If the MR's own stated
> cause is not what produces it, that is your finding, whether or not the symptom
> stops.
>
> Everything the MR asserts about itself is evidence here: comments, copy strings,
> test names, the description. Where one of them disagrees with what the code
> does, one of them is wrong and the intent was not fully met. Say which.
>
> Verdict: `MEETS INTENT`, `PARTIALLY`, or `MISSES`, each with `file:line`.

This is the question agent reviews most often skip, and it is the one that makes
a review feel like a review. Measured across two runs of this skill on the same
MR, not one of eight find agents ever asked whether the reported bug was actually
fixed. They all checked that the described changes were present, which is a
different question and a much easier one.

## 3. Question 2: blast radius

The highest-yield question in practice. Every real finding across two measured
runs came from here: a second caller of a changed hook, a sibling branch of the
same switch, a cascade the new copy text describes that never runs.

Spawn **two subagents in parallel**, each with the fact sheet:

- **Reachability:** every caller of every changed function, every render path, every
  sibling of any branch this MR touched. For each, does the change alter what that
  caller sees, and is that alteration correct there too? A changed shared helper is
  a change to every one of its callers.
- **State and lifecycle:** null and empty handling, boundary values, cached and
  stale state, error paths that swallow, tenant or environment scoping, N+1
  queries, missing `await`, type assertions hiding a real mismatch. What states can
  this code be in that the author was not picturing?

Both are bounded. Enumerate, check each, stop. When the list is covered you are
done, and "I checked all nine callers" is a complete answer.

Contradiction work lives in both questions rather than in an axis of its own. In
Q1 a contradiction is evidence the intent was missed. In Q2 it is usually a
reachability question: a payload that disagrees with its own invariants, a field
computed before a later step changes what it describes, a comment asserting a
cascade that does not run.

### The reporting contract every find agent must follow

Put this in each brief verbatim. It is the single highest-value paragraph in
the skill.

> Report each finding as five fields:
>
> - `file:line` of the defect
> - the claim, one sentence
> - the failure it predicts
> - **`producer`: the `file:line` of code that can actually create the triggering state, or the config default that makes that state the normal case**
> - which question raised it (Q1 intent, Q2 blast radius, Q3 quality)
>
> You must trace backwards to fill `producer`. A type that permits the state is
> not a producer. A caller that could pass the bad value is not a producer unless
> it does. A library behaviour that would break things is not a producer unless
> something reaches it.
>
> If you cannot name a producer after looking, the finding is not a finding yet.
> Put it in a separate **Questions** list, phrased as "can X happen?", with what
> you already checked. Do not pad that list, and do not move a finding there to
> dodge the trace.
>
> Confirmations are one line each with no evidence: "bullet 3 implemented at
> `file:line`". Spend your evidence on findings.

Why this field and not more severity labels: on a measured review, every finding
that survived refutation had named a real producer, and every finding that was
refuted had proved a mechanism while assuming its input. The four refuted ones
each said "if X happened, Y breaks" and never asked whether X happens. Asking for
`producer` moves that backward trace into the find pass, where the agent already
has the files open, instead of buying a whole refuter subagent to discover the
input was imaginary.

The Questions list is what protects recall. The strongest finding on that same
review was an obscure failure reason a timid agent would have swallowed, so
`producer` routes findings, it never suppresses them. A question costs you two
greps. A refuter costs 130k tokens.

**Keep the question on every finding through to the report, and never rank
across questions.** A quality nit and an intent gap are not the same kind of
thing, and one severity order buries whichever question is quieter that day.

## 4. Question 3: is the code decent?

One subagent, and it starts with a search rather than a scan.

**Start here: does this already exist?** Search the repo for a helper, hook,
utility or pattern that does what the new code does. This is the highest-value
quality question and the one most often skipped. It is also the right shape:
searching for an existing implementation terminates, scanning for smells does
not.

Then classify anything else found by whether the cost compounds. A preference is
paid once by one reader. A real problem is paid by every future reader, or by
every future change.

**Tier 1, the cost compounds across future changes:**

- Duplicated logic that must change together. Fix a bug in one copy and you must
  find the rest.
- Reimplementing what the repo already has. The copy drifts, and fixes to the
  original never reach it.
- A second way to do an established thing, introduced by this MR. Every future
  author now picks, and every reviewer arbitrates.
- **A comment, copy string or test name that is factually wrong.** Worse than
  none, because it is actively believed. This one is always a comment regardless
  of anything else below.
- No test on the behaviour that changed, subject to the mutation rule below.

**Tier 2, the cost compounds for readers but not for changes:** mysterious names
that need the definition opened to understand the call site, primitive obsession
where a type would catch a real class of bug, a function long enough to actually
hide a branch rather than merely long.

**Tier 3, paid once:** naming style, casing, abbreviations, property and import
ordering, alphabetisation, `for` versus `map`, formatting, test suite naming,
copy phrasing, comment wording. **These never leave the agent.**

### The nit test

> If the author replied "I prefer it this way", would you drop it? Then it is a
> nit. Do not report it.

### The mutation rule for missing tests

A missing test is a Tier 1 finding **only if you can name the one-line mutation**
to the code this MR changed that reverts the behaviour the MR is for, and that
leaves the suite green. Put the mutation in the finding.

If you cannot name such a mutation, there is no finding. Either the behaviour is
covered, or the change is not behavioural. This is what keeps the rule from
becoming "add more tests": a test that only fails when the language itself breaks
is not a test of behaviour, and no behavioural mutation will reach it.

Run the mutation if the worktree has dependencies installed. Usually it does not,
so reason it instead and say which you did. A named mutation makes the comment
self-evidencing: the author checks it in under a minute.

The same rule read backwards catches a weak test the MR *adds*: if no mutation to
the code under test can make the new test fail, the test cannot fail. That is a
Tier 2 finding, not Tier 1, because a weak test costs less than no test.

### Disposition

| | Where it goes |
|---|---|
| Tier 1, introduced by this MR | MR comment |
| Tier 1, inherited from before | Verdict notes. Does not block |
| Factually wrong comment or string | MR comment, always |
| Tier 2, introduced by this MR | Session summary. The user promotes it if they want it |
| Tier 2, inherited | Dropped |
| Tier 3 | Dropped, silently |

**Did this MR introduce it?** is the gate that matters most, and it is cheap to
check: the line is either in the diff or it is not. An inherited smell in a
touched file is not this author's debt, and flagging it punishes whoever happened
to open the file.

**Is it actionable here?** Tier 1 findings often need restructuring, which the
nit filter would otherwise reject as a design conversation. Resolve it by raising
it as a follow-up question rather than a change request: "the same guard is in
three other containers, want a ticket?" costs the author nothing to answer.

No fixed quota. A quota of three is wrong when an MR introduces five real
duplications, and it manufactures nits when it introduces none. The gates do the
work. Keep a soft backstop of five total quality findings purely to catch a
runaway agent, and if you hit it, say so rather than silently truncating.

**Quality never blocks the verdict.** It can only add a line to it.

## 5. Merge and cut, before spending a single refuter

The find agents overlap heavily, and question 3 alone will hand you a pile of
style observations. Refuting all of it is the expensive mistake: a refuter is a
whole subagent, and a nit you were going to drop does not need one.

Do this by reading, in one pass, no subagents:

1. **Merge duplicates.** Same `file:line` and same mechanism from two agents is
   one finding, and the agreement is worth noting on it. Merge before anything
   else: it tells you which Questions are load-bearing for a surviving finding
   and which are not worth answering at all.
2. **Answer the Questions lists that still matter.** Each entry is "can X
   happen?" and most die or confirm in one or two greps. A question that confirms
   becomes a finding with you as its producer. A question that dies is a one-line
   drop.
3. **Drop everything Tier 3 and everything inherited below Tier 1.** Phase 4's
   disposition table already decided these. Do not re-litigate them here.
4. **Settle anything that turns on one or two greps.** If you can confirm or
   kill a finding yourself in under three tool calls, do it and record the
   result. Spawning a 130k-token refuter to confirm what one `grep` already
   showed you is the most avoidable spend in this skill.
5. **Send to refuters only findings that have a producer and need multi-file
   tracing.** Uncertainty about what happens next is what refuters are for.
   Uncertainty about whether the input exists is a guess, and it belongs in the
   Questions list.

Expect this to cut the list by roughly half. Report the count before and after
so the user can see what was dropped cheaply versus what was tested.

## 6. Refute (fresh subagents)

This is the phase that earns the skill. Findings written by a review pass are plausible by construction, which is exactly what makes them dangerous.

Spawn **one subagent per finding**, in parallel, each with no knowledge of the other findings and no knowledge of the review that produced this one. Give each agent:

- The worktree path `/tmp/mr/wt-$IID`.
- The fact sheet `/tmp/mr/$IID-facts.md` from phase 1.
- The claim, stated neutrally: file, line, the predicted failure, and the
  producer the find pass named.
- This brief:

> Your job is to disprove this claim. Work in the worktree. The fact sheet holds the plumbing already traced, so start from the claim, not from scratch. Read the flagged lines, then trace outward: every callee the flagged code invokes, every caller that can reach it, the library behaviour it depends on, and the types or schemas that constrain its inputs. The evidence that settles this almost never lives in the flagged file.
>
> Attack the producer first. If the state that triggers this cannot be created, nothing downstream matters and you are done.
>
> You have roughly 20 tool calls. If you cannot construct the failure inside that, return `REFUTED` and say what you checked. Do not go pull live data.
>
> Return exactly one verdict:
> - `REPRODUCED` with concrete inputs or state that produce the failure, plus the `file:line` proving each step of the path.
> - `REFUTED` with the `file:line` that makes the failure impossible: a caller that guards it, a type that forbids it, a constant that cannot vary, an upstream that always advances.
> - `PARTIAL` when the claim has several prongs and they do not share a fate. Say which prong reproduced and which is refuted, each with its `file:line`.
> - `UNFALSIFIABLE` if there is no failure scenario to test, because the claim is about taste, readability, or a hypothetical future change.
>
> If you reject the producer you were given but find a different one that works, that is `REPRODUCED`. Say plainly that you substituted it and name the new one. Rejecting a bad producer and reproducing on a real one is the job working correctly, not a partial result.
>
> Default to `REFUTED` when you cannot construct a failure. "It would be safer to" is not a failure scenario. A severity label is not evidence.

That is the whole brief. The fact sheet is allowed because it is claim-free; your
hypotheses are not. An agent handed your guesses about where bugs live searches
your hypothesis space instead of the code, which is how an author's blind spot
survives its own review.

A `REFUTED` verdict that cites no `file:line` is invalid: rerun that refuter
rather than accept it. The two rules guard opposite failures. Default-to-REFUTED
stops the critic caving to a confident reviewer, which is the documented way
adversarial review goes wrong. The citation requirement stops it caving to
laziness instead.

**Verdict handling:**

| Verdict | Action |
|---|---|
| REPRODUCED | Survives to the verdict |
| PARTIAL | The reproduced prong survives. Trim the comment to it and drop the rest |
| REFUTED | Dropped. Record the one-line reason. |
| UNFALSIFIABLE | Dropped unless the phase 4 disposition table already placed it |

For any finding claiming a crash, hang, data loss, or security hole, run **three** refuters and drop it unless at least two return REPRODUCED. The same goes for any finding that accuses existing production code of being silently broken: that is a serious claim about someone else's work and one agent's word is not enough. Everything else gets one.

**Budget.** All find agents run in parallel, so they cost one agent's wall clock
between them. They are also, once phase 5 does its job, the **more expensive half
in tokens**: measured on one MR, four find agents cost 538k against five refuters'
482k. Refuters set wall clock, find agents set the bill. If phase 5 leaves more
than about a dozen findings, refute the ones that predict the worst failure first
and say what you deferred, rather than spawning thirty agents and making the user
wait.

**Gate: a trigger path today.**

Ask of every survivor: what command, request, or event triggers this in the code
as it exists right now?

If the answer needs a future change (someone adds an npm script, a config flag
flips, a caller that does not exist yet passes the bad value), it is a latent
footgun, not a defect. Drop it from the MR and put it in the session summary.
A mechanism being real is not enough.

## 7. Verdict, then draft

**The verdict comes first, and it is the part the user actually wants.** A list of
comments is not a review. State one of:

- **Approve.** Q1 met, no Q2 finding that survived. Quality notes may ride along.
- **Approve with notes.** Same, plus Tier 1 quality findings or inherited debt
  worth a follow-up ticket. These do not block.
- **Needs a change.** Q1 missed or partially met, or a surviving Q2 finding.
  Name the single thing that has to change. If there are several, name the one
  that matters most and say the rest are below it.

The rule that decides it: **questions 1 and 2 block, question 3 does not**, unless
the code is genuinely bad. An MR whose bug is fixed, whose blast radius is clean,
and whose code you would have written differently is an approval with notes, not a
change request. Say so plainly.

Where there was no ticket, say the verdict rests on the author's own description.

Then the comments. Invoke the `concise` skill. Every surviving finding becomes one
comment.

Each comment states:

1. What goes wrong. The concrete broken state.
2. When. The input or sequence that triggers it.
3. What to do. A direction, or a straight question if you are unsure.

One to three sentences. No em dashes. No "consider". No severity emoji. No restating the diff. If you are not certain, ask a question rather than assert with a hedge.

Decide the anchor for each comment:

- **Inline** when the finding sits on a line the diff touched. Note the file, the line number in the new file, and whether the line is added, removed, or context.
- **MR-level** when the finding is about the change as a whole, about a file the diff did not touch, or about a missing requirement. Quote the `file:line` in the body so the author can still find it.

## 8. Approve (stop)

Show the user the verdict, then a table, then the full text of every draft comment. Do not post anything yet.

```markdown
## MR !<IID>: <title> by @<author>

**Needs a change.** The guard stops the crash but not for the reported case: the
report quotes an empty bucket name, and the new check tests length only
(`upload.ts:47`).

Q1 intent: PARTIAL. Q2 blast radius: 1 finding. Q3 quality: 2 notes, neither blocking.

Found <n> -> cut <c> -> refuted <r> -> **posting <p>**

| # | Q | File | Line | Anchor | Finding | Evidence |
|---|---|------|------|--------|---------|----------|
| 1 | Q1 | `src/upload.ts` | 47 | inline | The reported empty-name case still reaches the indexer | Reproduced: ticket quotes `name: ""`, the guard tests `name.length < 3` and `""` passes it at `:47` |
| 2 | Q2 | - | - | MR-level | The other caller of the changed helper has no guard at all | Reproduced: `batch.ts:103`, its only early return is `!file` at `:96` |

**Notes, not blocking**
- The same folded guard is in three sibling handlers (`copy`, `move`, `rename`). Want a ticket?

**Dropped (<c+r>)**
- Offline placeholder: refuted, the parent gate short-circuits first (`Page.tsx:44`)
- Copy-text alphabetical order: Tier 3
- "Consider extracting this helper": nit, the author could reasonably disagree

**Comments to post**
...full text of each...
```

Ask which to post. Default is all of them. Accept edits to the wording before posting.

## 9. Post

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
- **Never post without the phase 8 gate**, even when every finding is solid.
- **Do not comment on lines the MR did not change** unless the change breaks them. Say which changed line breaks it.
- **Do not repeat an existing comment.** You read the discussions in phase 0.
- **The MR's green tests are the author's belief, not proof.** A test written beside the code asserts what its author expected; a path those tests never execute is unread code, not covered code.
- **Being wrong toward fewer comments is cheap to fix. The reverse is not.**
- **Report what you dropped**, one line each. The user overrides your filter, not the other way round.
- Clean up the worktree and the local branch when the review is done.
