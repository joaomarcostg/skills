# Foundation governance

Use the project foundation as a persistent implementation contract. Establish concrete product decisions, carry them through reusable code, and check them when a page or component changes. Treat this workflow as an explicit project convention; do not claim access to any company's internal design process.

## Contents

- [Make the foundation durable](#make-the-foundation-durable)
- [Classify and bind rules](#classify-and-bind-rules)
- [Apply rules on every task](#apply-rules-on-every-task)
- [Use page and component patterns](#use-page-and-component-patterns)
- [Enforce what can be enforced](#enforce-what-can-be-enforced)
- [Critique the finished design](#critique-the-finished-design)
- [Extend without fragmentation](#extend-without-fragmentation)
- [Record exceptions and evidence](#record-exceptions-and-evidence)

## Make the foundation durable

1. Find the existing canonical design-system document and linked implementation. Prefer that location; otherwise create `docs/design-system.md` when establishing a foundation. Keep one index even if supporting files are split by topic.
2. Record the product's user task, design principles, supported contexts, rule registry, token source, component/pattern catalog, and reference screens. Map shared parts to their actual exports/paths and representative consumers. Make principles actionable: for example, "keep the amount and currency visible when comparing costs" rather than "make it intuitive."
3. Link the foundation from the existing contributor or project documentation entry point. If an established agent-instruction file has an appropriate project-guidance section, add a concise path pointer there when in scope; preserve all unrelated instructions. Do not rely on conversation memory as the only source of product rules.
4. Keep values in executable sources. Bind rules to actual token names, variants, paths, and selectors. Document meaning and relationships without creating a second independently maintained palette or scale.
5. Adopt only decisions needed by the product. Mark alternatives being explored as provisional and select a concrete implementation before expanding it. Mark irrelevant categories as not applicable with a reason.
6. Record a foundation revision when its contract changes. Update the affected rule, implementation, example, and relevant checks together. Do not force a separate process document or a version bump for every copy edit.

Use public systems as evidence for useful practices. Material explicitly treats accessibility, content, states, layout, and tokens as foundations; those categories are broader than a palette ([Material foundations](https://m3.material.io/foundations/)). Adapt their decisions to this product instead of combining unrelated systems' aesthetic defaults.

## Classify and bind rules

Keep origin and strength separate:

| Origin | Meaning | How to apply |
| --- | --- | --- |
| Accessibility requirement | A cited criterion within the selected conformance target. | Preserve its actual scope, level, and exceptions; do not substitute a product preference for the criterion. |
| Adopted project rule | A deliberate, product-specific contract. | Require it for applicable new work; extend it or document an exception when a real need conflicts. |
| Provisional default | A starting decision being validated. | Choose a concrete candidate, test it in context, then adopt or revise it. Do not silently present it as established policy. |

Use `MUST` for an adopted requirement, `SHOULD` for a strong recommendation with reasoned exceptions, and `MAY` for an allowed option. These labels organize project guidance; they do not supersede the user's current instructions or higher-priority workspace rules.

Give each actionable rule these fields:

| Field | Required content |
| --- | --- |
| ID and statement | A stable name such as `SPACE-02` and an observable requirement. |
| Origin and strength | Accessibility/project/provisional; MUST/SHOULD/MAY. |
| Scope | Applicable component, page pattern, state, theme, locale, or density. |
| Binding | The actual token, variant, reusable primitive, or canonical implementation. |
| Verification | Exact existing automated check, browser interaction, or specific manual comparison. |
| Exception | Identifier and rationale if a bounded exception exists. |

Use the visual and interaction references as candidate rule catalogs. Preserve existing project identifiers where present. Do not copy their example token names into a project with an established vocabulary.

Before calling a foundation adopted, resolve the applicable choices, create or identify their executable sources, and validate a representative screen or component. Keep missing runtime evidence visible. An empty template and a list of principles do not constitute an adopted foundation.

## Apply rules on every task

1. **Reload:** read the current foundation and the relevant pattern. Check recent changes and exceptions affecting this scope; do not assume the last task's choices still apply.
2. **Map:** identify the user's task, page/component pattern, applicable rule IDs, and reusable implementations. Search the catalog and real consumers; decide what to reuse, extend, compose, or keep local using the composition reference. A short working note is sufficient; do not generate a new planning document for each page.
3. **Resolve gaps:** reuse a suitable rule, extend the existing shared contract, or record a justified exception. Make missing choices explicit before spreading them across screens.
4. **Implement:** compose approved roles, variants, and patterns. Keep structural details local where they do not represent a shared design decision.
5. **Review:** check conformance and whether the design actually supports the task. Test meaningful content and state variations; repair shared causes at their source.
6. **Persist:** update the canonical foundation only if the contract changed; report applicable evidence and remaining limits.

For a small repair in an undocumented product, infer only the relevant local conventions from existing code and examples. For a new page or reusable component without a documented foundation, capture the minimal applicable foundation first. Avoid inventing certainty about a company's style or documenting the entire product to change one label.

## Use page and component patterns

Record a small catalog of patterns actually used by the product. Reuse an existing component, layout utility, or documented CSS recipe; a new abstraction library is optional.

| Pattern | Stable decisions to carry across pages |
| --- | --- |
| Page shell and header | Content width, gutters, title/supporting text, breadcrumbs when useful, local action hierarchy. |
| Form or settings page | Field relationships, grouping, validation timing, help/errors, save/cancel behavior, dirty and pending states. |
| Collection or data view | Toolbar/filter placement, row density, selection, sort/pagination, truncation, empty/no-results behavior. |
| Detail page | Identity, key facts, sections, edit actions, related information and long-content behavior. |
| Feedback and overlays | Message scope, persistence, accessible announcements, interruption level, focus, dismissal, recovery. |

Add only relevant patterns. Record controlled variations such as compact/comfortable density or narrow/wide layout. Keep comparable screens consistent; allow a justified composition when a different user task requires it.

## Enforce what can be enforced

Connect each adopted rule to an enforcement mechanism. A written instruction is procedural guidance; mechanical prevention requires real project configuration or code. Do not call a rule automated until its check exists and runs.

| Concern | Useful mechanism | Remaining judgment |
| --- | --- | --- |
| Shared colors, type, spacing, motion | Canonical tokens, generated adapters, supported token linting. | Whether the chosen semantic role fits the task. |
| Variants and states | Existing typed component APIs and shared state handling. | Whether the variant/state model covers the user need. |
| Composition and reuse | Canonical exports/styles, shared implementations, existing import-boundary checks when available. | Whether parts share a responsibility; whether page overrides bypass their contracts. |
| Layout relationships | Shared containers, stacks, grids, field and action-group patterns. | Grouping, alignment, hierarchy, content density. |
| Keyboard, forms, recovery | Accessible primitives and targeted behavior tests. | Meaningful focus, understandable feedback, real task completion. |
| Contrast and semantics | Available accessibility scans plus manual checks. | Unscanned states, interaction quality, full conformance. |
| Visual consistency | Existing visual regression tooling and reference screens. | Intentional changes, clarity, style and hierarchy. |

When establishing a system or addressing recurring drift, wire low-overhead checks supported by the stack into its existing verification workflow where they provide real coverage. Examples include typed variants or an existing linter rule against unapproved color literals outside the token source. Test that a representative violation is detected before claiming enforcement.

Keep literal exceptions and migration boundaries explicit. Do not ban all numeric CSS or all arbitrary utility syntax; inspect whether a value encodes a shared decision. Prefer the established tools; introduce new infrastructure only when the requested system and concrete risk justify it. Do not add a dependency solely to populate the table above.

## Critique the finished design

Review the representative rendered screen and flow, using real content and applicable states. Compare against the project foundation and an established reference screen. A token-compliant screen can still have poor information priority or interaction cost.

Translate requests for Apple-like or FAANG-level quality into concrete criteria for this product: clear hierarchy, exact alignment and spacing relationships, coherent visual identity, responsive adaptation, stable state transitions, precise feedback, accessible interactions, and recoverable failures. Capture observations from supplied references when available. Use public guidance such as [Apple layout](https://developer.apple.com/design/human-interface-guidelines/layout), [loading](https://developer.apple.com/design/human-interface-guidelines/loading), and [motion](https://developer.apple.com/design/human-interface-guidelines/motion) as inputs, applying the appropriate web behavior. A brand comparison is an aspiration; do not label the result company-certified or infer a particular company's internal process.

Ask these questions and make concrete corrections:

- **Task and priority:** Can the user identify the page's purpose, primary information, and next action? Do supporting controls compete with the main task?
- **Grouping and rhythm:** Do related elements read as a group? Are sibling gaps, alignment, widths, and density consistent with the adopted pattern?
- **Hierarchy and legibility:** Do type roles, contrast, and emphasis distinguish primary content from metadata? Does the hierarchy survive narrow layouts and zoom?
- **Content resilience:** Are important messages complete? Can similar long names be distinguished? Is full truncated content available through the prescribed keyboard/touch path?
- **Interaction and recovery:** Are affordances, status, errors, next steps, focus, and return paths clear in the actual flow?
- **Motion and stability:** Does movement explain a change without delaying control, shifting targets, or breaking reduced-motion behavior?
- **Response and continuity:** Does an action receive prompt feedback? Do loading, refresh, and recovery preserve useful content, input, focus, and task context? Check the actual flow under relevant slow or failed operations.
- **Identity:** Do surfaces, iconography, imagery, borders, radii, and elevation match the project's intended character?

For a substantial new pattern, use an independent review when available and proportionate. Provide the actual brief, foundation, implementation, and screenshots; do not supply the reviewer's desired conclusions. For usability questions requiring human feedback, identify the remaining hypothesis and evidence needed instead of claiming that agent review proves user understanding.

Fix introduced functional/accessibility failures, rule violations, hidden critical content, and misleading states. Resolve visible inconsistency relevant to the requested scope. Keep unrelated legacy issues distinct; do not use this review to justify an unrequested redesign.

## Extend without fragmentation

- Reuse an existing token, variant, or pattern when its meaning and behavior fit.
- Extend a shared contract when a new reusable distinction is necessary. Update relevant consumers, documentation, and checks in the same change.
- Keep a one-off structural or editorial choice local when it has no reusable semantic meaning; document it if it conflicts with an adopted rule.
- Treat breaking changes to public component APIs or shared design semantics as explicit migrations. Identify affected consumers and preserve compatibility where the task requires it.
- Do not preserve an accessibility defect merely for visual consistency. Correct the affected implementation with the smallest suitable shared change, and record broader unresolved impact honestly.

Shared changes can affect code, design assets, and guidance together; Atlassian's contribution guidance explicitly identifies that cross-system impact ([Atlassian contribution guidance](https://atlassian.design/contact-us)). Use the project's actual ownership and review conventions. Do not invent an external committee or require user approval for routine authorized changes.

## Record exceptions and evidence

For a deliberate exception, record the rule ID, affected scope, user need or constraint, chosen alternative, relevant accessibility implications, and revisit/removal condition. A direct user-requested deviation is sufficient authorization for its intended scope; surface conflicts and document the decision without adding an automatic confirmation step. An exception to a project preference does not establish accessibility conformance.

For new pages, reusable components, and shared changes, produce a compact result in the existing review record or final response:

| Rule or family | Status | Evidence or limit |
| --- | --- | --- |
| [applicable rule] | Pass / Fail / Not verified / Exception | [actual check, source comparison, or linked exception] |

Use `Pass` only for the checked scope. Treat `Not verified` and `Exception` distinctly. Do not invent a composite numerical design score or imply every criterion was assessed. Reuse existing project gates when they exist; finish with a clear account of the requested outcome and unresolved material limits.
