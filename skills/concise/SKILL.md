---
name: concise
description: Write or rewrite text that another human will read, so it sounds like a person wrote it. Use for merge request comments, MR and PR descriptions, Slack messages, Jira comments, commit messages, docs, and any reply to a colleague. Also use when the user says text is too AI-like, too long, too hedged, or asks to make it plain, brief, or natural.
---

# Concise

Text that goes to another human. They are busy, they did not ask for an essay, and they can tell when a machine wrote it.

Two modes:

- **Rewrite.** The user hands you a draft. Cut it down and de-tell it. Keep every fact.
- **Write.** You are producing the text yourself. Apply the same rules from the first word.

## The three questions

Every sentence has to survive all three:

1. **Does the reader already know this?** Cut it.
2. **Can they see it in the code or the thread?** Cut it.
3. **If they act on this sentence, what do they do differently?** No answer means cut it.

Most drafts lose half their length here, before any style work.

## Banned outright

**Em dashes.** No long dash, and no `--` standing in for one. Use a period, a comma, or parentheses. Two short sentences beat one sentence with a dash in it.

**Words that mean nothing here:** leverage, utilize, robust, seamless, comprehensive, streamline, facilitate, delve, ensure that, holistic, best-in-class, significant (unless you name the number).

**Openers that stall:** "It's worth noting that", "It's important to note", "Great catch!", "Good question!", "I've gone ahead and", "Just wanted to flag", "Quick note:".

**Closers that repeat:** "In summary", "Overall", "To recap", "Let me know if you'd like me to", "Happy to discuss further."

**Hedge stacking:** "you might possibly want to consider maybe". Pick one hedge or none.

**The tricolon habit:** "not just faster, but cleaner and easier to maintain." Three-part lists everywhere is the strongest AI tell there is. Use two items, or four, or write a sentence.

**Bold-label-colon bullets** as a default layout:

```
**Performance:** the query is faster
**Safety:** the guard prevents a crash
```

That is a slide, not a message. Write prose unless there are genuinely parallel items to compare.

**Emoji severity markers.** No red or orange circle prefixes on findings.

## Style

- One idea per sentence. Under 25 words.
- Active voice. "This drops the filter", not "the filter is dropped".
- Present tense for how code behaves.
- Common words. ASD-STE100 spirit.
- Name the thing. `removeInvalidFilters`, not "the helper function".
- Numbers over adjectives. "3 extra queries per page", not "several additional queries".

## Merge request comments

The specific failure to avoid: a comment that names a concern without explaining the defect, so the author cannot tell whether to act.

**A comment needs three things:**

1. What goes wrong. The concrete broken state, not the category.
2. When it goes wrong. The input or the sequence that triggers it.
3. What to do. A direction, or a question if you genuinely do not know.

**Bad:**

> Consider adding validation here for robustness. This could potentially lead to unexpected behavior if the input is malformed.

**Good:**

> `bucket` can be a 2-character string here, and `parseBucketName` indexes `[2]`, so it returns `undefined` and the upload silently writes to the root. Worth a length check before line 88.

Length: one to three sentences, plus a code block if it saves words. If it takes more than that, the comment is really a design discussion. Say that and take it to the thread or a call.

**Do not restate the diff.** The author wrote it. Start at the consequence.

**Uncertain? Ask, do not hedge.** "Is `retry` reachable with a null cursor here?" beats "this might possibly retry with a null cursor."

**No praise sandwiches.** If the code is good, say nothing or say it once, plainly.

## Commit messages and MR descriptions

Commit: `<verb> <what>`. No ticket tag in the subject. No Claude attribution, ever.

MR description: what changed, why, how to verify. Reference the Jira ticket in the description body. Three short sections beat one long one.

## Self-check before sending

1. Zero em dashes?
2. Can you cut another 30% without losing a fact?
3. Would you say this out loud to the person, in these words?
4. Does every claim name a concrete consequence, not a category?
5. Any sentence the reader could have written themselves? Cut it.
