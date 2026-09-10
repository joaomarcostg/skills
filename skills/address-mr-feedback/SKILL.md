---
name: address-mr-feedback
description: Read, evaluate, and address review feedback on GitLab MRs or GitHub PRs — from CodeRabbit and other bots AND from human reviewers. Use when the user asks to address MR/PR feedback, handle review comments, respond to reviewers, or work through CodeRabbit/bot comments on a merge request.
---

# MR/PR Review Feedback Handler

Read every reviewer's comments on a merge request — CodeRabbit and other bots as well as human reviewers — evaluate each one, and address them.

**Core design principle:** do the minimum shell work to get the raw data into a file, then use the `Read` tool and your own reasoning for everything else. No `jq` pipelines, no `grep`/`awk` post-processing, no shell loops. You parse JSON natively — use that.

**Why this skill handles humans and bots differently:** a bot comment is a self-contained technical suggestion you can judge on correctness alone. A human comment carries authority and intent — it may be a blocking concern, an open question, a preference, or just praise. Misreading a reviewer's question as a code-change request (or silently dismissing their blocking concern) damages trust and stalls the MR. So the workflow below classifies *who* said something and *what they want* before deciding how to respond.

## Invocation

The user will say something like:
- `/address-mr-feedback` (uses current branch's MR/PR)
- `/address-mr-feedback 583` (MR/PR number)
- `/address-mr-feedback https://gitlab.com/group/project/-/merge_requests/583`
- `address the review comments on my MR`
- `respond to the reviewers on PR 412`

Parse the MR/PR identifier from the user's message. If a URL is provided, extract the project path and ID from it. If nothing is provided, detect from the current branch:

```bash
# GitLab
glab mr view --web=false -F json
# GitHub
gh pr view --json number,url,title,headRefName
```

## Step 1: Dump everything you need into files, then read them

You need: **MR/PR metadata** (including the author, so you can tell your own comments apart) and **all discussions/review comments**. Fetch each with a single command that writes raw JSON to `/tmp/mr/`. Then use the `Read` tool to inspect them.

Do **not** pipe through `jq` to slice fields — read the whole JSON and let the model pick out what it needs. One Read is cheaper in context than multiple bash roundtrips.

### GitLab

```bash
mkdir -p /tmp/mr
glab mr view <IID> -F json > /tmp/mr/mr<IID>.json
glab api "projects/<PROJECT_ID>/merge_requests/<IID>/discussions?per_page=100" > /tmp/mr/mr<IID>-discussions.json
```

If the discussions file is large (>1MB) or has more than 100 threads, paginate:
```bash
glab api --paginate "projects/<PROJECT_ID>/merge_requests/<IID>/discussions?per_page=100" > /tmp/mr/mr<IID>-discussions.json
```

### GitHub

```bash
mkdir -p /tmp/mr
gh pr view <NUMBER> --json number,title,url,headRefName,baseRefName,body,author > /tmp/mr/pr<NUMBER>.json
gh api --paginate "repos/<OWNER>/<REPO>/pulls/<NUMBER>/comments" > /tmp/mr/pr<NUMBER>-comments.json
gh api --paginate "repos/<OWNER>/<REPO>/pulls/<NUMBER>/reviews" > /tmp/mr/pr<NUMBER>-reviews.json
gh api --paginate "repos/<OWNER>/<REPO>/issues/<NUMBER>/comments" > /tmp/mr/pr<NUMBER>-issue-comments.json
```

(GitHub splits feedback across three endpoints: `pulls/.../comments` = inline diff comments, `pulls/.../reviews` = review summaries + approve/request-changes verdicts, `issues/.../comments` = top-level conversation. Read all three.)

After the dump, **use the `Read` tool** on each file. No further shell is needed for analysis.

## Step 2: Categorize by author and read whole threads

Read each file with the `Read` tool. With the JSON in context, do the following inline — no shell, no `jq`.

### 2a. Identify the MR/PR author

From the metadata, note the author's username. **Their own notes are not feedback to address** — skip threads the author started (unless the user asks otherwise). Replies *by* the author inside a reviewer's thread are still relevant context (what was already discussed/promised).

### 2b. Classify each thread by who started it

For each discussion, look at the **first note's author** and bucket the thread:

- **CodeRabbit** — `author.username` contains `coderabbit`, or matches a known CR bot username from earlier in the conversation (GitLab often uses names like `group_*_bot_*`; once you identify one CR thread, capture that username and reuse it). Body signals also confirm: `<!-- This is an auto-generated comment by CodeRabbit`, `by coderabbit.ai`, `**Actionable comments posted:**`, `<details><summary>🤖 Prompt for AI Agents</summary>`, or a severity marker like `_⚠️ Potential issue_`, `_🛠️ Refactor suggestion_`, `_📝 Nitpick_`.
- **Other bots** — CI/coverage/security bots (Sonar, Codecov, Danger, pipeline bots). Usually informational; treat as low priority unless they flag a real blocker.
- **Human reviewers** — everyone else who is not the author and not a bot. These are the comments that most need careful reading.
- **AI-assisted humans** — a human account posting machine-generated findings. Judge these on *content*, not on the account.

### 2b-i. AI-assisted review from a human account

Classifying by account alone misreads this case: the comments arrive with a
colleague's authority but were generated the same way a bot's were. Signals, in
rough order of reliability:

- Many comments posted within seconds of each other, across unrelated files.
- Uniform structure — every comment the same shape, often severity-labelled or
  headed in bold.
- Suggestions that restate what the code already does, or comments on lines the MR
  never touched.
- Hedged, non-committal framing throughout: "consider…", "you might want to…",
  "it would be safer to…", with no reference to product context.
- No engagement with *why* the change exists — nothing that requires having read
  the ticket.

When those signals are present, treat the **findings** with the burden of proof in
Step 5, exactly like a bot's. But treat the **person** as a person: reply with
normal courtesy, do not resolve their threads yourself, and route real
disagreements to the user. A colleague ran a tool over your diff — that is not
carelessness, it just means the text carries no more evidence than a tool's does.

Say so plainly in your summary (e.g. "8 comments from @alice, structurally
machine-generated — verified rather than assumed"), so the user can correct you if
that reviewer really did write them by hand.

### 2c. Read the full thread, not just the first note

For each non-author thread, read **every note in the thread**, in order. Threads often contain back-and-forth: a reviewer asks, the author answers, the reviewer follows up. The latest state determines what (if anything) is still owed. A question that the author already answered, or a concern already addressed in a reply, may need no further action.

### 2d. Filter to unresolved

For each thread, check whether it is **resolved**: the `resolved` field on the last note (GitLab) or `isResolved` on the review thread (GitHub). By default, **skip resolved threads** unless the user asked for "all" or "including resolved".

Produce an in-memory list of unresolved threads with these fields:

- discussion `id` (needed later for replying/resolving)
- `source` (CodeRabbit / bot / human — and the reviewer's name if human)
- `file` + `line` (position.new_path / new_line; null for MR-level conversation)
- `body` (the full thread text — the original comment plus any replies)
- for CodeRabbit: `severity` (from the first body line) and any `🤖 Prompt for AI Agents` block

## Step 3: Classify intent (what does each comment actually want?)

Before judging correctness, decide what the commenter is asking for. This matters most for humans, whose comments aren't pre-structured:

| Intent | Signal | How you'll respond |
|--------|--------|--------------------|
| **Change request** | "please rename", "this should…", "extract this", a CR suggestion | Code edit, then reply |
| **Question** | "why did you…?", "is this intentional?", "what happens if…?" | A reply (and maybe a code change if the answer reveals a bug) |
| **Concern / blocker** | "this will break X", "are we sure this is safe?", a `request-changes` review | Investigate seriously; fix or explain — never silently dismiss |
| **Suggestion / nitpick** | "could maybe", "optional", "nit:", CR Nitpick | Default to dismissing — see Step 5 |
| **Praise / non-actionable** | "LGTM", "nice", "👍", approval | Acknowledge; no action |

A single human comment can carry more than one intent — note each.

## Step 4: Cross-check against local code — follow the claim, not the line

For each comment that references code, use the `Read` tool to open the referenced file at the specific lines. Verify:

- Does the code still look like what the reviewer saw? Or has a later commit changed it?
- Is the comment still applicable?
- Is there already a fix in a subsequent commit on the branch?

**Do not stop at the flagged file.** Confirming that a comment accurately describes
the line it points at is not verification — it is reading comprehension. Almost
every substantive claim is really a claim about the *system*: "this loop can hang"
is a claim about what the callee can return; "this fails silently" is a claim
about what the framework does with the result; "this input is dangerous" is a
claim about what callers can pass. The evidence that proves or refutes it lives in
those other files, so trace the chain before judging:

- **Callees** — the implementations behind every call the flagged code makes.
  A loop with no guard is not a hang if its data source provably always advances.
- **Callers** — who can reach this code, with what inputs? An "unvalidated" value
  may be validated (or constant) at every call site.
- **Framework/library internals** — when the claim depends on what Express, the
  SDK, or a validator does, read it in `node_modules`; do not trust the comment's
  (or your own) recollection of library behaviour.
- **Types and invariants** — the type system, a schema, or a documented invariant
  in a neighbouring file may make the claimed state unrepresentable.

Trace until you can name the concrete failure state or prove it unreachable.
Budget guide: a one-hop read for a style claim; the full chain for anything
claiming a hang, leak, security hole, or silent failure.

Group reads by file to minimize tool calls — if you have 3 comments on the same file, read it once with a wide line range, not three times.

## Step 5: Evaluate — the claimant carries the burden of proof

Machine-generated review is cheap to produce and expensive to absorb. A reviewer
running an AI over the diff can post twenty confident, plausible, well-formatted
findings in seconds. Read charitably ("is this reasonable?") almost all of them
pass, because they *are* reasonable-sounding — that is exactly what makes them
noise. Two AIs then manufacture agreement, and the MR grows changes nobody needed.

So invert the default. **A machine-generated finding is not actionable until you
can demonstrate the defect.** Try to refute each one first; act only on the ones
that survive.

### The refutation test

Run this on **every substantive claim, from any source — bots and humans alike.**
Who said it changes how you *respond* (a human's finding is never unilaterally
dismissed — route disagreement to **Discuss**), but it never exempts the claim
from the attempt. A careful human reviewer is wrong in exactly the same way a bot
is: plausibly, confidently, and about code two files away from the one they read.
Taking their comment for granted because it is well-written is the same failure as
taking a bot's for granted because it is well-formatted.

Attempt to disprove each claim before accepting it, using the cross-file trace
from Step 4 — the refutation almost never lives in the flagged file. State which
of these you got:

1. **Reproduced** — you can name concrete inputs or state that produce wrong
   behaviour, and you verified it (a scratch script, a failing assertion, reading
   the code path end to end). → **Accept**.
2. **Refuted** — you tried and the claimed failure cannot occur: the input is
   impossible, a caller already guards it, the type system prevents it, the
   "insecure" value is a local constant. → bot: **Dismiss**, and say why;
   human: **Discuss**, with the evidence.
3. **Unfalsifiable** — no failure scenario exists to test, because it is a taste
   claim ("consider extracting", "this could be clearer"). → **Dismiss** unless it
   contradicts a documented project convention.

If you cannot construct a failure scenario, there is no bug. "It would be safer
to…" is not a failure scenario. Neither is a severity label — a bot writing
`🟠 Major` is not evidence.

**No verdict without an outcome.** A claim has exactly one of the three outcomes
above, and the outcome is settled by the trace, not by reading the flagged lines
— re-reading the line a comment points at is reading comprehension, not an
attempt. Every verdict you present carries its outcome and the evidence that
settled it (`Reproduced — removeInvalidFilters drops empty boolean nodes,
DataQuery.ts:205`). A claim still waiting on its trace has no verdict yet; finish
the trace before presenting, however plausible the claim reads. Plausible is the
adversary here: the claims most tempting to wave through on a read-through are
exactly the well-written ones.

Prefer evidence over argument. Two lines proving the old pattern accepted a
2-character bucket settle a question that paragraphs of reasoning do not.

**Worked example — why the trace is not optional.** A human reviewer reported
that a `fetch` tool's pagination loop could hang: same cursor + empty page +
`hasMore: true` changes no loop state. Read against the flagged file only, the
claim verifies — the loop genuinely has no guard — and the lazy verdict is Accept.
The refutation lived two files away: the loop's only upstream force-fits the
first row into every page *specifically so an empty page cannot occur*, throws on
a stale cursor, and provably advances the offset whenever `hasMore` is true. The
hang was unreachable. The same trace then surfaced what the comment missed: each
loop iteration re-fetched the **entire report** upstream just to slice one page —
a real cost bug the flagged file could never reveal. Both halves of that verdict
— the refutation and the bigger find — required reading files the comment never
mentioned. One trace, two corrections, in opposite directions.

### Do not confuse cheap with correct

A one-line change being trivial to apply is not a reason to apply it. The volume
is the problem, so a useful test is: **would I make this change if nobody had
commented?** If no, dismiss it — applying it anyway grows the diff, adds review
surface, and trains the next reviewer to post more of the same.

### Verdicts

| Verdict | Meaning |
|---------|---------|
| **Accept** | Reproduced a real defect; implement. |
| **Partial** | Real, but the suggested fix doesn't fit the codebase; adapt it. |
| **Answer** | No code change needed — owes a reply. |
| **Discuss** | A human's substantive point you disagree with, or a genuine judgment call. Surface to the user; never decide unilaterally. |
| **Dismiss** | Refuted, unfalsifiable, or a nit you would not have made unprompted. Record the reason. |
| **Skip** | Already fixed in current code (note which commit or how). |

Weigh by:
- **Reproducibility** — can you make it fail? This dominates everything below.
- **Who is speaking.** The burden of proof applies to *machine-generated* findings.
  A human's own reasoning still outranks a bot's: never unilaterally **Dismiss** a
  human's substantive comment — prefer **Discuss** and let the user decide.
- **Severity, once verified** — bug/security > correctness > performance >
  readability > style. An unverified "security" claim ranks below a verified typo.
- **Project fit** — check `CLAUDE.md`, `AGENTS.md`, and nearby code before
  accepting any style or structure suggestion. Existing convention beats a bot's
  preference, and "the codebase already does it this way" is a complete refutation.
- **Trade-offs** — does the fix add complexity, a dependency, or an abstraction
  with one caller?

### Report the dismissals as a group

Dismissed nitpicks are worth one line each, not a paragraph — the user needs to
audit your judgment cheaply, not read a defence:

```
Dismissed (12): 8 style preferences contradicting existing conventions,
  3 unfalsifiable ("consider extracting"), 1 refuted — the flagged regex is
  built from local constants, so the ReDoS path needs attacker-controlled input
  that cannot reach it.
```

If the user disagrees with a dismissal they will say so. Being wrong in the
direction of a smaller diff is cheap to correct; the reverse is not.

## Step 6: Present the summary to the user

Output a single summary grouped by source, then by verdict. Do **not** start editing yet.

```markdown
## Review Feedback — MR/PR !<N>: <Title>

**<total> threads** (<unresolved> unresolved, <resolved> resolved) · <human> from reviewers, <cr> from CodeRabbit, <bot> from other bots

### 👤 Human reviewers (<count>)
| # | Reviewer | File | Lines | Intent | Summary | Verdict | Refutation attempt |
|---|----------|------|-------|--------|---------|---------|--------------------|
| 1 | @alice | `src/foo.ts` | L42 | Concern | Race condition on retry | Accept | Reproduced — retry caller holds no lock, `queue.ts:88` |
| 2 | @bob | — | — | Question | Why drop the cache here? | Answer | — (question, nothing to refute) |
| 3 | @alice | `src/bar.ts` | L88 | Suggestion | Prefer enum over string | Discuss | Refuted — codebase convention is string unions, `types.ts:12` |

### 🤖 CodeRabbit (<count>)
| # | File | Lines | Severity | Summary | Verdict | Refutation attempt |
|---|------|-------|----------|---------|---------|--------------------|
| 4 | `src/foo.ts` | L12 | Nitpick | Rename variable | Dismiss | Unfalsifiable — taste claim |

### ⚙️ Other bots (<count>)
| # | Bot | Summary | Verdict |
|---|-----|---------|---------|
| 5 | Codecov | Coverage −0.3% on foo.ts | Skip (test added) |

### Skip (already fixed) (<count>)
- `file.ts:L30` — addressed in commit <sha>
```

The **Refutation attempt** column is the gate: every Accept, Partial, Dismiss,
and Discuss row names its outcome (Reproduced / Refuted / Unfalsifiable) and the
evidence that settled it — usually a `file:line` outside the flagged file. A row
you cannot fill is a trace you have not finished; go back to Step 5 for that
claim before presenting the table. Questions and praise take "—".

Then ask the user:
1. Which comments to address (default: all Accept + Partial + Answer)?
2. How to handle **Discuss** items — get their decision on each.
3. Any verdicts to override?

Do not ask whether to reply on GitLab/GitHub — Step 8 already settles that per
thread. Human threads get a reply; bot threads mostly do not.

## Step 7: Implement fixes

Only after the user confirms:

1. Group changes by file to minimize edits.
2. For each file, `Read` → `Edit` with a precise old/new string.
3. For CodeRabbit, the `🤖 Prompt for AI Agents` block is a hint — always verify against current code; it can be stale.
4. If a fix requires architectural judgment (e.g. "refactor this whole module"), stop and ask instead of guessing.
5. After all fixes, run the project's type check / lint:
   ```bash
   npx tsc --noEmit --pretty 2>&1 | head -50
   ```
6. Verify each fix against the claim it answers, and nothing wider: re-run the
   Step 5 refutation on the new code, asking whether the reported failure is
   still reachable. Do **not** spawn a fresh blank-slate review of the whole MR
   to "check the fixes". A fresh reviewer samples the space of plausible
   objections again and will find new ones; on real review data that loop
   raised false positives 62% and never converged. The MR is done when CI is
   green and every accepted claim is verified fixed, not when a reviewer runs
   out of things to say.

## Step 8: Push, then reply only where a reply adds something

**Push before replying.** CodeRabbit re-reviews on each new commit and resolves its
own findings that the new code addresses. Nothing auto-resolves until the fixes are
pushed, so push first, then look at what is still open.

### Humans: reply to every thread you touched

Concise, first-person, no mention of AI assistance. Match the register — a
teammate's question deserves a real answer, not a one-word "Done".

- **Change request / fix made** → "Done — <what changed>."
- **Question** → answer it directly; if it surfaced a bug you fixed, say so.
- **Concern you addressed** → explain what you changed and why it resolves it.
- **Disagreement** → state your reasoning respectfully; leave the thread open for
  the reviewer rather than resolving it yourself.

Let the **original human commenter** resolve their own threads when the matter is a
judgment call. Only resolve a human thread yourself when the user okays it.

### Bots: silence is the default

Do **not** post "Done — fixed" on a bot thread. The bot re-reads the diff on the
next push and resolves the finding itself, so that reply is pure noise: it buries
the human comments that actually need attention and inflates the thread count a
reviewer has to scan.

Reply to a bot thread only when the reply carries information the diff does not:

| Situation | Why a reply earns its place |
|---|---|
| **Disagree / dismissing** | Otherwise it looks unaddressed, and the next person re-litigates it. State the reason, then resolve — you are declining, so leaving it open is noise. |
| **Adapted, not applied** | You solved it differently from the suggestion. The bot may not recognise its finding as fixed and will re-raise it, and a human reading the diff cannot tell the deviation was deliberate. |
| **A question back to the bot** | You need it to re-check something specific. |
| **The user asks for a sweep** | See below. |

Everything else — a suggestion you implemented as written — gets no reply. Push
and let the bot close it.

Never resolve a bot thread just because you replied, except when dismissing. Let
the bot resolve on re-review; that way a still-open thread means something.

### Sweep mode

When the user says something like "reply to the open CodeRabbit threads" or "tell
CodeRabbit it's fixed", they are asking you to nudge a bot that did not
auto-resolve. Then, and only then, reply to each still-open bot thread naming what
changed, so it re-checks on the next pass. Do not resolve those threads — the
point is to let the bot decide.

### Always report what you left silent

End your report with the bot threads you deliberately did not answer, so the user
can trigger a sweep if the bot fails to close them:

```
Addressed silently (expect CodeRabbit to auto-resolve on this push):
  - StorageURIUtils.ts:62 — tightened hostname labels
  - OSSService.test.ts:29 — added malformed-host cases
Replied: 1 (adapted the suggestion — shared constant instead of a local regex)
```

### GitLab

Reply to a discussion:
```bash
glab api --method POST "projects/<PROJECT_ID>/merge_requests/<IID>/discussions/<DISCUSSION_ID>/notes" -f "body=Done — <what changed>."
```

Resolve the thread:
```bash
glab api --method PUT "projects/<PROJECT_ID>/merge_requests/<IID>/discussions/<DISCUSSION_ID>" -f "resolved=true"
```

### GitHub

Reply to a review comment:
```bash
gh api repos/<OWNER>/<REPO>/pulls/<NUMBER>/comments/<COMMENT_ID>/replies -f "body=Done — <what changed>."
```

Resolve a review thread (GraphQL):
```bash
gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<THREAD_NODE_ID>"}) { thread { isResolved } } }'
```

Add a brief pause between API calls when posting many replies (rate limiting).

## Important notes

- **Never auto-fix.** Always present the summary table and wait for user confirmation before editing.
- **Humans outrank bots in courtesy, not in evidence.** Their claims get the same refutation attempt; the difference is the outcome — a refuted human claim becomes **Discuss** with the evidence, never a unilateral dismissal.
- **Don't chat with the bots.** A reply that only says "fixed" tells CodeRabbit nothing it won't work out from the next push, and costs a human reviewer a thread to scroll past. Reply when you disagree, adapted the suggestion, or have a question.
- **Verify every claim before accepting it — by tracing, not by re-reading the flagged line.** Reviewers of both kinds assert confidently and are sometimes wrong, sometimes right for the wrong reason. Reproduce the problem — a two-line script proving the old pattern accepted the bad input is worth more than the finding's severity label — and remember the proof or refutation usually lives in a callee, a caller, or the library, not in the file the comment points at. If it turns out to be a false positive, say so in the thread instead of complying quietly.
- **Refuting is not the same as being adversarial.** The burden of proof is a test applied to *claims*, not a stance taken toward *people*. When a finding survives the attempt, accept it cleanly and without hedging. And do not let a findable counter-argument talk you out of a real bug — if you can reproduce the failure, it is real no matter how it was reported.
- **Refute claims, never the reviewer's standing.** Dismissals go in your summary to the user as one line each. In-thread, decline briefly and factually, and never imply the comment was machine-generated or low-effort.
- **Read whole threads.** A reviewer's point may already be answered or withdrawn further down the thread.
- **Local code is the source of truth.** The MR diff and the current working tree may have diverged.
- **Respect project conventions.** Check `CLAUDE.md` / `AGENTS.md` and nearby code before accepting style suggestions.
- **Branch alignment.** Confirm you're on the correct branch before making fixes.
- **No shell gymnastics.** After the initial dump to `/tmp/mr/`, read files with the `Read` tool and reason directly. No `jq`, no `grep`, no loops.
