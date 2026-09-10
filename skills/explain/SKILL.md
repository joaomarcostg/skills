---
name: explain
description: Explain a concept, system, bug, merge request, or piece of code from the ground up, in plain language with real examples. Use when the user asks "what is X", "explain X", "how does X work", "walk me through this MR", says an answer did not land, or asks to re-pitch something. Also use before writing any walkthrough or review summary a human has to read.
---

# Explain

The reader has zero shared context. They do not know your acronyms, your codenames, your file layout, or why any of it exists. Everything you write has to be understandable using only what you have already said.

If they invoked this skill, a previous explanation failed. Do not repeat it louder. Take it apart and rebuild it from the problem up.

## Step 1: Verify before you explain

Grep it. Read it. Cite `file:line`. Never explain a codebase from memory.

If you cannot verify a claim, say so inline: `(not verified, my guess)`. An honest gap costs less than a confident wrong sentence.

## Step 2: List your undefined terms

Before writing, list every term, acronym, flag name, table name, and codename you are about to use. For each one:

- Define it at first use, or
- Cut it and use plain words instead.

If the codebase never expands an acronym, say that: "RPQ, which the code never expands." Never invent an expansion.

## Step 3: Four beats, in order

Each beat must be understandable using only the beats before it. Use bold micro-headers so the reader can skim and still follow.

1. **The problem.** What goes wrong without this thing. Not what the thing is. "Every customer has different label keys, so you cannot design a fixed schema" comes before "RPQ flattens labels into columns."
2. **What it does.** One sentence. Plain words.
3. **How it works.** The mechanism, carried by one worked example.
4. **Why it matters here.** Tie it back to the MR, bug, or decision actually on the table. An explanation that does not land somewhere is trivia.

## Step 4: The example is mandatory

One concrete example beats three paragraphs. Use real values, not placeholders.

Weak: "the label gets flattened into a column."

Strong: "`environment=prod` on a billing row becomes the column `label_17 = 'prod'` in the flattened table."

When explaining a bug, put wrong next to right:

```
before:  filters.filter(f => f.value)      // drops value: false
after:   filters.filter(f => f.value != null)
```

## Step 5: Analogy, when the concept is genuinely new

Reach for an analogy when the reader has no existing hook for the idea. Skip it when they already do. A forced analogy is worse than none.

Rules for a good one:
- Map it to something physical or everyday, not to another piece of software.
- State where the analogy breaks. Every analogy breaks somewhere, and the unstated break is where the reader gets lost later.

Example: "A Temporal workflow is a recipe that survives the kitchen burning down. The steps are recorded, so a new cook picks up at step 4. Where it breaks: unlike a recipe, the steps must give the same result every time they are replayed, so `Date.now()` is banned inside one."

## Style

- Short sentences. One idea per sentence.
- Active voice. "The worker retries the activity", not "the activity is retried".
- Common words. ASD-STE100 spirit.
- No em dashes. Use a period, a comma, or parentheses.
- No jargon chains. Two unfamiliar nouns in a row means the sentence has failed.
- Present tense for how things work.

## Do not

- Do not open with a summary of what you are about to explain. Just explain.
- Do not use a term before defining it, even once, even in a heading.
- Do not stack qualifiers ("essentially, in most cases, generally"). Say the common case, then name the exception.
- Do not pad with what the reader can already see. If they pasted the code, do not narrate it back.
- Do not use bullet lists to dodge writing a sentence that connects two ideas.

## Self-check before you send

Read your draft back and answer these. Any "no" means rewrite that part.

1. Could a competent engineer who has never seen this repo follow it top to bottom?
2. Is every term defined before it is used?
3. Is there at least one example with real values in it?
4. Does every claim about the code have a `file:line` behind it?
5. Does the last paragraph connect to the thing the user is actually trying to decide or fix?
6. Zero em dashes?

## When the user says it still did not land

Ask which beat broke, then rebuild only that beat. Do not restate the whole thing. Common breaks:

- They did not accept the problem. Go back to beat 1 and ground it in something they have hit.
- A term slipped through undefined. Find it and define it.
- The example was abstract. Replace it with real values from their data.
