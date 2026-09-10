---
name: oncall
description: End-to-end workflow for an on-call ticket or bug fix, in any codebase. Routes the bug to the repo or module that owns it, explains it in plain language, reproduces it, writes a failing test, fixes the root cause, sends a fresh agent to review, then ships. Use when the user says "I'm on call", "take this ticket", "fix BUG-1234", pastes a Jira, Sentry, or issue link, or reports a bug to work through.
argument-hint: <ticket id, URL, or bug description>
---

# On-call

One ticket, start to finish. The order is fixed because each phase depends on the one before it. A fix written before the bug is reproduced is a guess.

This skill is project-agnostic. It tells you what to establish and where to look for it in whatever repo you are in. For a feature rather than a bug, use `feature`, which swaps the failing-test gate for a frozen acceptance-criteria list.

```
0 Intake + route -> 1 Explain (stop) -> 2 Reproduce -> 3 Red test -> 4 Fix
  -> 5 Green -> 6 Fresh review -> 7 Demo (optional) -> 8 Ship
```

Two hard gates. **Phase 1** stops for the user. **Phase 3** blocks: no failing test, no fix.

## 0. Intake and route

### Read the ticket

Read it wherever it lives: Jira, Linear, a GitHub or GitLab issue, a Sentry event, a Slack thread.

- **Issue tracker:** the description, every comment, every linked issue. Comments usually hold the real reproduction steps.
- **Error tracker:** stack trace, breadcrumbs, and how many users and accounts it hit.
- **Chat:** the whole thread, not the first message.

Extract: reported steps, expected vs actual, account and environment, first seen, blast radius (one account or all, and whether related or child records inherit it).

If the steps are missing or vague, say so now. Guessing them costs a full cycle.

### Route it to the owning repo or module

**Do this before reading any code.** In a multi-repo or multi-package product the symptom rarely names the owner. Find the map the project already keeps: a workspace-level `README.md`, `AGENTS.md`, or `CLAUDE.md` that says which repo or package owns which concern. Use it to name your primary suspect and say why.

A bug can span two owners. A wrong number on screen is usually the service that computes it, not the UI rendering it.

**Then read the owner's `AGENTS.md`, `CLAUDE.md`, or `CONTRIBUTING.md` before touching it.** Each repo has its own conventions, build gotchas and hazards. They are not interchangeable.

For data bugs (numbers wrong, data missing, a job failing), look for a triage doc or runbook first. Projects that run pipelines usually keep one, and it answers faster than reading source.

## 1. Explain the bug (stop)

Invoke the `explain` skill.

1. **What the user sees.** The broken behaviour in their words, with real values.
2. **Why it happens.** Your hypothesis, grounded in code you have read, with `file:line`. Mark what is still a guess.
3. **Blast radius.** Which accounts, which integrations or providers, whether child or related records inherit it, whether other regions or environments differ.
4. **What the fix probably touches.** Files, and the shared function all callers route through.

Stop. Let the user correct the hypothesis before you spend a reproduce cycle on it. They know things the ticket does not say.

## 2. Reproduce

**You have not reproduced it until you have seen it fail.** A code path that looks wrong is not a reproduction. Record the exact wrong value, error text, or empty result. That string is what phase 3 asserts on.

### Run the project locally

Find how the project boots rather than reconstructing it: a project skill, `Makefile`, `package.json` scripts, `docker-compose.yml`, `CONTRIBUTING.md`. If the bug needs production-shaped data, use whatever the project documents for seeding or restoring a local database from a snapshot.

For a service with background jobs or workflows, check whether the worker runs inside the API process or separately. A bug in a job never reproduces while the worker is not running.

### Infrastructure as code

There is no runtime to reproduce against. **The plan diff is the reproduction.** Enter the workspace or stack that owns the resource and run the plan (`tofu plan`, `terraform plan`, `pulumi preview`, `cdk diff`). Capture the output showing the wrong resource state. That output is your before-and-after evidence.

**Hazard.** Never edit a secret or config version by hand in a cloud console to fix it quickly. When workloads mount a secret that tracks `latest`, a hand-edited version reaches the next cold-starting instance with no deploy and no review, and the next apply silently reverts it. Change the code and apply it.

### Escalate to a shared environment only when local cannot do it

Local cannot reproduce a bug that needs deployed infrastructure: real cloud credentials, production-shaped data volume, cross-service auth, CDN or hosting behaviour, orchestrator-level behaviour.

1. **Find the deploy path** in the CI config. Common shapes: a manual job on the MR pipeline (which usually needs an open MR, so open a draft first), a preview deploy per branch, a reserved shared environment.
2. **Ask the user which environment to use**, and to reserve it if the project reserves them. Wait for the answer.
3. **Fire the deploy and watch it land** (`glab ci status`, `gh run watch`, or the project's equivalent), then reproduce against the deployed URL.

**Before the user releases the environment, revert anything you left behind**, especially database migrations. The next person inherits the environment, not a clean one. Remind the user to release it once the ticket ships.

## 3. Red test (blocking gate)

Write the check that replays the reported steps and **fails on the current code**. Run it and watch it fail before you change any source. A test written after the fix proves nothing, because you never saw it catch the bug.

The form varies by stack; the gate does not.

| Stack | The red artifact |
|---|---|
| Application code | A test in the area's existing test file, in the project's own runner |
| Infrastructure as code | A captured plan diff showing the wrong resource state, since committed automated tests usually do not exist here |
| SQL functions and views | A query asserting the output for the failing input |

Rules that hold everywhere:

- Put it where the repo already puts tests for that area. Follow the surrounding file.
- Assert on the concrete broken value from phase 2, not a category. `expect(total).toBe(1420.55)`, not `toBeDefined()`.
- The reported input plus the boundary next to it. Two cases, not twelve.
- Name it after the behaviour, not the ticket.

**If the bug genuinely cannot be tested automatically**, stop and tell the user why in one or two sentences and let them decide. Do not quietly skip this phase and ship on a demo video.

## 4. Fix the root cause

Read every caller before you edit. `grep` the function you are about to change.

One guard in the shared function is a smaller diff than a guard in each caller, and patching only the path the ticket names leaves every sibling caller broken. The ticket reports one symptom. Fix the cause once, where all callers route through it.

Resist scope. A second bug you spot goes to the user as a sentence, not into this diff.

### Trace one hop out before you commit

Grep the callers of every symbol you changed, and read the comments and docs
that state contracts about them. The answers to the questions below usually
already live there.

The bug is local to the function you edit; its consequences are not. A change is reviewed against the whole system but written against one function, and that gap is where the "every MR always has something to fix" findings live. They are almost never in the flagged file. Before you commit, answer these for each function you changed. Each maps to a real class of missed bug.

- **Callers: how do they key, cache, or pair your output?** If you made the output depend on a new input, does the caller's cache key vary on it? A query cache key that strips a field you now read serves a stale result forever. If two runs feed one paired result (a KPI comparing current against previous), do they still decide symmetrically, or can one narrow while the other does not?
- **Pipeline neighbours: what runs before and after?** If your code reads a shared buffer, which stage last wrote it? A later stage may have replaced the rows with a different shape, so your sum is silently zero.
- **The predicate you protect: does yours match where the thing renders?** Guarding "a budget layer exists" when the budget column only renders at one granularity makes the guard wider than what it protects, and the fix reads as done where it is not.
- **Every guard exemption is a claim, so test it both ways.** A guard that skips case X needs a test proving it skips for X *and* fires for not-X. Testing only "the fix works" leaves the exemption's negative space uncovered, which is exactly where these hide.

If you cannot answer one, you have not read far enough. This is the trace a reviewer applies to a claim, run at build time instead.

## 5. Green

The phase 3 check passes, the phase 2 reproduction no longer reproduces (walk the same steps on the same stack), and the project's full check is green **unfiltered**. Find it rather than guessing: `package.json` scripts, `Makefile`, `Justfile`, `CONTRIBUTING.md`, or the CI config, which is the authority on what has to be green before merge.

Regenerate anything generated, or CI fails on a correct fix: API specs, client SDKs, protobufs, snapshots, migration files, lockfiles. If a file is generated, CI probably verifies it matches its source.

Say plainly which of these you ran. If one is still failing, that is the report, not a rounding error.

## 6. Fresh review: one broad pass, then converge

A reviewer is a candidate-defect generator, not a correctness oracle. Given an
unbounded artifact it will always find another plausible objection, and every
fresh pass samples that space again. Measured on real review data, repeated
fresh re-review raised false positives 62% while barely moving recall, and was
the worst strategy tested. Each fix also moves the code, so the loop has no
fixed point. So this phase runs **one** broad review, falsifies every finding,
fixes the survivors once, and then verifies those fixes. It never reopens a
blank-slate review. Done is defined below, outside the reviewer.

### Pick the tier first

| Tier | What | Depth |
|---|---|---|
| Mechanical | copy text, a config value, a rename, a one-line guard with a test | Phase 5 checks only. No reviewer. |
| Normal | everything else | One broad review. One refuter per finding. |
| High-risk | auth or permissions, money (billing, invoicing, pricing), schema migrations, anything that cascades across accounts or regions, secrets or infrastructure | One broad review. Three refuters per finding, two of three to survive. |

### The broad pass

Spawn a **fresh agent with no memory of building this**. Give it the branch
diff, the ticket, the repo path, and the owning repo's conventions doc. Not
your reasoning, not this conversation: independence is what makes its findings
worth refuting, and more context measurably makes reviewers worse.

> Review this change as if you are seeing it for the first time and the author is not in the room. Do not assume the change is correct.
>
> Cover: does it fix the reported bug, or only the symptom the ticket named? Which callers of the changed functions were missed? What happens on the error path, on empty input, for a different provider or integration, for a child or related account, in a second region or environment? Does it break any rule stated in this repo's conventions doc? Is the test real, meaning would it fail if the fix were reverted? What is missing from the ticket's requirements?
>
> For each changed function, trace one hop out, because that is where the real findings sit and not in the flagged file: do callers cache or key on anything the function now depends on, so a stale entry is served? Do paired runs that feed one result stay symmetric? What stage runs after it, and in what shape does it leave the shared data? Does a guard's predicate match where the thing it protects actually renders? Does every guard exemption have a test proving it fires for not-X as well as skips for X?
>
> Report each finding as: severity, `file:line`, the concrete failure scenario (these inputs or this state produce this wrong result), and your confidence. Do not propose fixes. Naming the failure is the whole job; asking a reviewer to also repair is what makes it reject correct code. A report with zero findings is a valid and expected outcome when the trace comes back clean. Name what you checked and found clean, so the gaps are visible.

### Refute, fix once, verify the fixes

Put every finding through the **refuters** from `review-mr` phase 3: one fresh
subagent per finding (three for the high-risk tier), told to disprove it, given
the claim and the worktree and nothing else. `REPRODUCED` survives. `REFUTED`
is dropped with its one-line reason. `UNFALSIFIABLE` becomes a one-line note in
your report and never reopens the loop.

Fix every `REPRODUCED` finding, all of them, once.

Then verify the fixes, and only the fixes:

- For each fixed finding, one refuter against the new code with the original
  claim: is this failure still reachable?
- One review of the fix's own diff (`git diff <pre-fix sha>..HEAD`), same brief
  as above, scoped to that diff.

Anything `REPRODUCED` here gets fixed and verified the same way. If that happens
a second time, stop and report it: two rounds of fixes breeding new failures is a
design problem, not a review problem, and another pass will not converge it.

### Done

- Phase 5 checks green, unfiltered.
- The phase 3 red test is green and the phase 2 reproduction no longer reproduces.
- Zero unresolved `REPRODUCED` findings.

The reviewer does not define done. "The reviewer found nothing" is not a
criterion, because it never will for long. "The reviewer found something" is
not a failure until a refuter reproduces it.

## 7. Demo (optional)

Use `record-demo` when the fix is visual or when a reviewer would otherwise have to take your word for it. Broken input first, then fixed input, on real data.

Skip it for a backend, data, or infrastructure fix the test already proves.

## 8. Ship

Open the MR or PR following the project's conventions for commits, titles, and descriptions. If a skill exists for that in this project, use it. One squashed commit, the ticket link in the description body, the commit prefix the repo uses (`fix:` in one repo, `Fix:` in the next; read the log). No AI attribution.

Convert the draft MR to ready if you opened one in phase 2. Then:

- Remind the user to release the shared environment, and to revert migrations first.
- Comment on the ticket with what was wrong, what changed, and how to verify. Write it with the `concise` skill.

## Report at the end

- Which repo or module owned it, and how you routed there.
- Where it was reproduced: local, or which shared environment.
- The check that gates it: file, name, and confirmation you saw it fail before the fix.
- What the fresh review found, and what you dropped.
- Generated artifacts you regenerated.
- What you did not do, and why.
