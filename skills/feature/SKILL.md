---
name: feature
description: End-to-end workflow for building a feature from a ticket, in any codebase. Reads the ticket, explains it, settles the decisions the ticket left open, freezes acceptance criteria, finds the pattern to follow, builds a vertical slice first, sends a fresh agent to review, optionally puts it in front of a stakeholder, then ships. Use when the user says "start this ticket", "build this feature", "take this issue", or pastes a feature ticket.
argument-hint: <ticket id, URL, or feature description>
---

# Feature

Building something that does not exist yet, from a ticket someone else wrote.

**The gate here is not a test, and that is the whole point.** A bug ships with its own spec: make the broken thing work, and a failing test proves you did. A feature has no such thing. The dominant failure is not building it the wrong way, it is **building the wrong thing well**. So the gate is a frozen acceptance-criteria list, agreed before any code exists.

This skill is project-agnostic. It tells you what to establish, and where to go looking for it in whatever repo you are in. For a bug rather than a feature, use `oncall`.

```
0 Intake -> 1 Explain + open decisions (stop) -> 2 Acceptance criteria (stop)
  -> 3 Pattern scout -> 4 Build -> 5 Green -> 6 Fresh review
  -> 7 Stakeholder review -> 8 Ship
```

## 0. Intake

Read the ticket wherever it lives: Jira, Linear, GitHub or GitLab issue, a spec doc, a Slack thread. Read the description, **every comment**, and any parent or linked issue. Comments carry the requirements the description missed.

**Establish whether the ticket is the whole thing or one slice of something bigger.** A ticket under an epic often reads ambiguously: build the ticket, or build the epic's description? This is the most common way a feature ends up two or three times its intended size, or gets called incomplete on delivery. Decide, then state which you are building and what you are deliberately leaving out.

Note who asked for it and who will judge it done. Phase 7 needs a name.

## 1. Explain, then settle what the ticket left open (stop)

First, invoke the `explain` skill on the feature:

1. **The problem.** What a user cannot do today. Not what the ticket asks for.
2. **What it adds.** One sentence.
3. **How it will work.** The path data or a request takes once it exists, with real values.
4. **Where it lands.** Which parts of the codebase it touches.

Then the sweep. **List every decision the ticket does not answer**, attach your recommendation to each, and ask the user all of them in one batch.

This is the cheapest phase in the workflow and it prevents the most expensive rework. Two minutes of questions beats a rebuild.

A checklist that turns up unstated requirements in most codebases:

| Question | Why it bites |
|---|---|
| What is the default, and is it on for existing users? | A feature defaulting on changes everyone's screen the day it ships |
| Who is allowed to see or do this? | Permission checks retrofitted late are a rewrite, not a patch |
| What happens to data created before this change? | Old records predate your new field, so every read path must handle its absence |
| New public surface, or extend an existing one? | Decides whether a contract, schema, or generated artifact changes |
| Does it fan out to related accounts, tenants, or child records? | Parent config that cascades turns a one-account feature into an all-account one |
| Which environments, regions, or locales need parity? | A second region usually means a second deploy path |
| Empty, loading, and error states? | Tickets describe the happy path. Reviewers ask about the other three |

Add to this list as you learn what a given project keeps forgetting to specify.

Stop. Wait for the answers. Do not start building on assumed defaults.

## 2. Freeze the acceptance criteria (stop)

Turn the ticket plus the phase 1 answers into a numbered list. Each item is one observable behaviour and names how it gets verified.

```
AC1  A report with no child rows shows the parent total, not zero.        [test]
AC2  Only users with write permission see the rename control.             [test]
AC3  Records saved before this change still load, with the toggle off.    [test]
AC4  The empty state reads "Nothing here yet" and offers the create action. [manual: visual]
```

Rules:

- **Observable, not internal.** "The response includes `childTotal`" is an AC. "A new `ChildManager` class exists" is not.
- **Every AC gets `[test]`** unless you can say in one clause why a test is not worth it. Visual and layout checks are legitimately manual. "Hard to test" is not a reason.
- Show the list to the user and get it confirmed.

**Confirmed means frozen. Anything added later is a scope change the user approves explicitly.** That cuts creep in both directions: you cannot quietly drop an AC, and you cannot quietly add work nobody asked for.

Write it properly, because it gets reused twice at the end: as the MR or PR test plan, and as the ticket comment.

### Plan critic, high-risk tier only

Decide the risk tier now; it governs this step and phase 6. **High-risk** means
the feature touches auth or permissions, money (billing, invoicing, pricing),
schema migrations or persisted state transitions, anything that cascades across
tenants or accounts, or secrets and infrastructure. Everything else is normal.

For a high-risk feature, before any code, spawn one fresh agent with the frozen
AC list, the pattern-scout file list, and the repo path, and nothing else:

> Your job is to find where this plan is wrong before it is built. Which assumption in it is most likely false, and what in the repo says so? Which existing abstraction or contract does it violate? What backwards-compatibility break does it cause for data or callers that predate it? Which migration or state transition has it forgotten? Which failure path has no representation in the AC? Report each as a claim with `file:line` evidence, and say what you checked and found sound.

Put its claims through the `review-mr` phase 3 refuters like any finding. A
surviving claim changes the plan, and any AC it touches goes back to the user.
A wrong design caught here costs a paragraph; caught in phase 6 it costs the
diff. Normal-tier features skip this: the user's answers in phase 1 and the
frozen AC are the plan review.

## 3. Pattern scout

Before writing anything, work out the shape the code should take, and report it as a file list for the user to glance at. A wrong shape caught here costs a minute. Caught in phase 6 it costs the diff.

**Read what the project already says about itself.** In rough order of authority:

- `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, and any nested per-package copies. A nested one overrides the root for its directory.
- Architecture decision records, usually `docs/adr/` or `docs/decisions/`.
- The linter and formatter config, which encodes rules nobody wrote down in prose.

**Then find the nearest existing feature** that already does something structurally similar, and name the files your feature mirrors. Prefer the **newest** sibling, not the oldest: conventions drift, and the most recent example is the one reviewers currently expect.

Report:

- The files you will add, and the files you will change.
- Which existing feature you are mirroring, by path.
- Any rule from the project's own docs that constrains this work, quoted.

If the project genuinely has no precedent for this shape, say so. That is a design conversation with the user, not a decision to make silently.

## 4. Build: vertical slice first

**One field, one endpoint, one visible element, wired end to end and actually running, before widening anything.**

A feature spanning N layers has N-1 contracts between them. Building a layer at a time means nothing runs until the last layer lands, and every mismatch surfaces at once during integration. One thin path proves the wiring in the first hour instead of the last.

Get the project running locally and confirm the slice works against real data before widening. If the project has a skill or documented command for booting it, use that rather than reconstructing it.

Then widen. While building:

- **Write the test for an AC when you build that AC**, at the seam the project already tests. Not all of them at the end.
- No abstraction with one caller. No config for a value that never changes. Reuse what is already there before adding anything.

Before calling the build done, trace one hop out from the diff: for every
changed function, how do callers key/cache/pair its output, what runs before
and after it in the same pipeline, and does any guard's predicate match where
the protected thing actually renders? Grep the callers of every changed
symbol and read the comments and docs that state contracts about them. The
findings a reviewer lands afterwards live in that hop, not in the changed file.
- Follow the conventions you quoted in phase 3, including the ones you disagree with. Argue them with the user separately.
- A second thing you notice goes to the user as a sentence, not into this diff.

## 5. Green

- **Every AC marked `[test]` has a passing test, and you have seen it fail with the feature removed or stubbed.** A test that passes either way tests nothing.
- Every AC marked `[manual]` has actually been checked, not assumed.
- **The project's full check passes, unfiltered.** Find it rather than guessing: `package.json` scripts, `Makefile`, `Justfile`, `CONTRIBUTING.md`, or the CI config, which is the authority on what has to be green before merge.
- **Regenerate any generated artifact the build depends on.** API specs, client SDKs, protobufs, snapshots, migration files, lockfiles. A staleness check that fails CI on a green feature is a common and avoidable waste. If a file is generated, the CI probably verifies it matches its source.

State which of these you ran. A step you skipped is reported, not omitted.

## 6. Fresh review: one broad pass, then converge

A reviewer is a candidate-defect generator, not a correctness oracle. Given an
unbounded artifact it will always find another plausible objection, and every
fresh pass samples that space again. Measured on real review data, repeated
fresh re-review raised false positives 62% while barely moving recall, and was
the worst strategy tested. Each fix also moves the code, so the loop has no
fixed point. So this phase runs **one** broad review, falsifies every finding,
fixes the survivors once, and then verifies those fixes. It never reopens a
blank-slate review. Done is defined below, outside the reviewer.

### Depth follows the tier chosen in phase 2

| Tier | Depth |
|---|---|
| Mechanical (a copy change, a config value, a rename with a test) | Phase 5 checks only. No reviewer. |
| Normal | One broad review. One refuter per finding. |
| High-risk | One broad review. Three refuters per finding, two of three to survive. |

### The broad pass

Spawn a **fresh agent with no memory of building this**. Give it the diff, the
ticket, the frozen AC list, the project's conventions docs, and the repo path.
Not your reasoning, not this conversation: independence is what makes its
findings worth refuting, and more context measurably makes reviewers worse.
Independence covers your QUESTIONS too. A reviewer handed your hypotheses
searches your hypothesis space, so it confirms the parts you already doubted
and leaves your blind spot exactly where it was.

> Review this feature as if you are seeing it for the first time and the author is not in the room. Do not assume it is correct or complete.
>
> Walk the acceptance criteria one at a time and point at the code satisfying each. Name any that are unmet or only partly met.
>
> Then: is there anything here nobody asked for? Does it follow the nearest existing pattern in this repo, or invent its own? Does it break any rule stated in the repo's own conventions docs? What happens to data that predates this change? What happens on the error path, on empty input, at the boundary values? Which callers of the changed functions were missed? Would each test fail if the feature were reverted?
>
> Check the feature against itself. Every payload the code builds, every invariant its tests and gates assert about that payload, and every claim its docs make are one system that has to agree. A field computed before a later step that can still change what it describes is the common break. The author cannot see these: each half matched their intent at the moment they wrote it.
>
> For each changed function, trace one hop out. Past findings here came from callers caching or keying on something the function now depends on, paired runs drifting out of symmetry, a later stage inheriting shared data in an unexpected shape, and a guard whose predicate missed where the protected thing actually renders. Treat those as the SHAPE of what to hunt, not the list to work through: pick your own lines of attack, and rank by contract surface rather than by whether the code computes anything, because code that merely lists and shapes records still emits fields that must agree with each other.
>
> Report each finding as: severity, `file:line`, the concrete failure scenario (these inputs or this state produce this wrong result), and your confidence. Do not propose fixes. Naming the failure is the whole job; asking a reviewer to also repair is what makes it reject correct code. A report with zero findings is a valid and expected outcome when every AC is met and the trace comes back clean. Name what you checked and found clean, so the gaps are visible.

### Refute, fix once, verify the fixes

Put every finding through the **refuters** from `review-mr` phase 3: one fresh
subagent per finding (three for the high-risk tier), told to disprove it, given
the claim and the worktree and nothing else. `REPRODUCED` survives. `REFUTED`
is dropped with its one-line reason. `UNFALSIFIABLE` becomes a one-line note in
your report and never reopens the loop.

Fix every `REPRODUCED` finding, all of them, once. An unmet AC is always
`REPRODUCED`: the AC is the failing test.

Then verify the fixes, and only the fixes:

- For each fixed finding, one refuter against the new code with the original
  claim: is this failure still reachable, or is this AC still unmet?
- One review of the fix's own diff (`git diff <pre-fix sha>..HEAD`), same brief
  as above, scoped to that diff.

Anything `REPRODUCED` here gets fixed and verified the same way. If that happens
a second time, stop and report it: two rounds of fixes breeding new failures is a
design problem, not a review problem, and another pass will not converge it.

### Done

- Phase 5 checks green, unfiltered.
- Every frozen AC met, with its `[test]` passing or its manual check recorded.
- Zero unresolved `REPRODUCED` findings.

The reviewer does not define done. "The reviewer found nothing" is not a
criterion, because it never will for long. "The reviewer found something" is
not a failure until a refuter reproduces it.

## 7. Stakeholder review

Default on when the feature has a surface a person can look at. Skip it when the user says to, or when nothing is visible.

If the project has a preview or shared pre-release environment, get the change onto it and hand the user the link plus the stakeholder from phase 0 to tag. The mechanics are project-specific, so follow the project's own skill or docs. Common shapes: a manual CI job on the MR pipeline, a preview deploy per branch, or a reserved shared environment.

Two hazards on any **shared** environment:

- **Reserve and release it properly.** Someone else is waiting, and a stale reservation blocks them silently.
- **Revert what you left behind before releasing it**, especially database migrations. The next person inherits the environment, not a clean one.

**Feedback loop.** Stakeholder changes are usually small and visual: apply, push, redeploy, tell them. A change that alters behaviour rather than appearance goes back through phase 6.

## 8. Ship

Record a short before-and-after clip when the feature is visual. The MR reviewer and the stakeholder are often not the same person, and a clip serves both.

Open the MR or PR following the project's conventions for commits, titles, and descriptions. If a skill exists for that in this project, use it.

**The frozen AC list becomes the test plan**, each line marked with how it was verified.

Then comment on the ticket with what was built, what was deliberately left out (from phase 0), and how to verify. Write it with the `concise` skill.

## Report at the end

- **AC coverage**: how many met, how each was verified, any unmet and why.
- What you deliberately did not build, and where it belongs instead.
- What the fresh review found, and what you dropped.
- Which generated artifacts you regenerated.
- Any shared environment still reserved in your name.
