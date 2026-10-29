# Project design foundation

<!-- Reuse the project's existing foundation if present. Adapt this template to the actual scope and names. Replace every applicable bracketed prompt with a concrete decision or source binding; remove irrelevant rows or mark them not applicable with a reason. Keep executable values in their canonical source. This document becomes an input to future page/component work, not a one-time design summary. -->

## Contents

- [Status and scope](#status-and-scope)
- [Design intent](#design-intent)
- [Canonical sources](#canonical-sources)
- [Component architecture and catalog](#component-architecture-and-catalog)
- [Adopted rule registry](#adopted-rule-registry)
- [Spacing and composition](#spacing-and-composition)
- [Responsive contracts](#responsive-contracts)
- [Typography and hierarchy](#typography-and-hierarchy)
- [Visual identity](#visual-identity)
- [Content and truncation](#content-and-truncation)
- [Page and interaction patterns](#page-and-interaction-patterns)
- [Loading and async contracts](#loading-and-async-contracts)
- [Motion contract](#motion-contract)
- [Verification and reference screens](#verification-and-reference-screens)
- [Changes and exceptions](#changes-and-exceptions)

## Status and scope

- Product and primary user task: [who needs to do what]
- Foundation revision and state: [revision; provisional or adopted; evidence limits]
- Supported platforms, locales, themes, and density modes: [only those in scope]
- Existing system / brand / design references: [paths or links]
- Entry point linking to this foundation: [existing project documentation path]

Before implementing a new page or component, read this foundation and the relevant pattern. Reuse its adopted rules. Change a shared rule at its source or record a bounded exception; do not silently create another default.

## Design intent

| Principle | Concrete product decision | Effect on layout or behavior |
| --- | --- | --- |
| [principle tied to a user task] | [what must be prioritized or preserved] | [observable consequence] |

Record the intended visual character with specific choices for typography, density, surfaces, emphasis, icons, imagery, and motion. Explain the task or brand reason. Identify the primary information, local primary actions, supporting information, and metadata.

## Canonical sources

| Concern | Canonical path / mechanism | Consumers / outputs |
| --- | --- | --- |
| Tokens and scales | [CSS / token / library source] | [styles and generated artifacts] |
| Theme resolution | [selector/provider/compiler] | [supported modes and scope] |
| Layout and components | [actual code paths / APIs] | [relevant users] |
| Patterns and examples | [existing docs/gallery/screens] | [covered states and contexts] |
| Generation and checks | [actual commands, or no generation] | [what is covered] |

Identify generated files. Preserve library naming and adapter contracts. Keep values in these sources and reference their roles here.

## Component architecture and catalog

Map primitive/semantic tokens, UI/layout primitives, composed patterns, feature compositions, and pages to the actual implementation. Preserve existing names and folders. Pages compose shared implementations; missing capabilities extend the owning source. Search this catalog and real consumers before adding another component.

| Layer / part | Canonical path or export | Purpose and supported API | Dependencies / state owner | Representative consumer or example |
| --- | --- | --- | --- | --- |
| [actual primitive or layout pattern] | [path] | [purpose, variants/slots; link to contract] | [tokens/primitives; state owner] | [usage] |
| [actual composed pattern or feature] | [path] | [purpose and supported contexts] | [shared parts; request/business owner] | [usage] |

Keep shared UI independent of feature-specific routes and services. Record its responsive, content, state, accessibility, and motion contracts in the linked source/docs/examples. Allow direct use of lower-level parts when no intermediate abstraction adds value. Keep one-off feature composition local; promote a stable contract when sharing is useful.

## Adopted rule registry

Record stable rule IDs and their actual project bindings. Separate accessibility requirements, adopted project rules, and provisional defaults. Use MUST/SHOULD/MAY deliberately. The rows below are examples to resolve or replace, not evidence that a check already exists.

| Rule ID and statement | Origin / strength | Scope | Canonical implementation | Verification |
| --- | --- | --- | --- | --- |
| SPACE-01: Repeated spacing relationships use the adopted mapping | [origin/strength] | [scope] | [tokens/layout defaults] | [check/comparison] |
| SPACE-02: Each layout boundary has one spacing owner | [origin/strength] | [scope] | [parent/child contract] | [review] |
| [Reuse rule]: Equivalent UI consumes its canonical shared implementation | [origin/strength] | [scope] | [catalog paths/APIs] | [consumer and bypass review] |
| RESPONSIVE-01: Components respond to available space | [origin/strength] | [supported contexts] | [component/layout constraints] | [container and viewport checks] |
| TYPE-01: Text uses complete named roles | [origin/strength] | [scope] | [type roles/source] | [check/comparison] |
| HIER-01: Information priority follows the page's task | [origin/strength] | [scope] | [page pattern] | [design critique] |
| STYLE-01: Surfaces and emphasis preserve their meanings | [origin/strength] | [themes/contexts] | [semantic role mapping] | [rendered checks] |
| CONTENT-01: Overflow follows the content-role policy | [origin/strength] | [scope] | [component defaults] | [long-content check] |
| CONTENT-02: Approved truncation preserves usable full-content access | [origin/strength] | [scope] | [reveal/detail path] | [keyboard/touch check] |
| [UX rule]: Equivalent tasks share behavior and recovery | [origin/strength] | [scope] | [interaction pattern] | [behavior check] |
| [Motion rule]: Animation follows the recorded motion contract | [origin/strength] | [scope] | [tokens/helper/component] | [normal/reduced check] |
| [Accessibility rule]: [specific criterion/project requirement] | [origin/strength] | [scope] | [primitive/pattern] | [actual check and limits] |

## Spacing and composition

- Approved scale: [canonical source and permitted roles]
- Ownership: [parent-owned gaps, component-owned padding/internal gaps, established exceptions]
- Reusable layouts: [actual stack/inline/grid/container/section patterns or CSS recipes]
- Page widths and alignment: [content/prose/data widths; alignment lines]

| Relationship | Token / component or pattern default | Narrow / density variation |
| --- | --- | --- |
| Icon to label | [binding] | [rule] |
| Label to control | [binding] | [rule] |
| Control to help/error | [binding] | [rule] |
| Field to field | [binding] | [rule] |
| Field group to group | [binding] | [rule] |
| Section to section | [binding] | [rule] |
| Panel/container inset | [binding] | [rule] |
| Page gutter / grid gap | [binding] | [rule] |

Define grouping and responsive transitions. Use an existing scale or adopt an explicit provisional one once; avoid a separate spacing decision for each page. Record optical adjustments at the component that owns them.

## Responsive contracts

| Component / pattern | Available-space constraints | Wrapping, stacking, or transformation | Shared query / breakpoint binding | Preserved task and input behavior |
| --- | --- | --- | --- | --- |
| [actual page shell, toolbar, section, collection, overlay] | [intrinsic/min/max rules] | [narrow/intermediate/wide behavior] | [source; container/viewport or none] | [essential content/actions, order/focus, touch/keyboard] |

Inspect supported narrow and wide layouts, intermediate widths, and boundaries affected by the change. Check shared parts in their relevant container contexts, with enlarged/long text and relevant states. Preserve reading/focus order and essential tasks; define deliberate overflow for inherently wide data. Keep touch capability independent of screen width. Record runtime evidence limits.

## Typography and hierarchy

| Text role | Canonical full type style | Usage / semantic structure | Growth / responsive behavior |
| --- | --- | --- | --- |
| Page title | [family/size/weight/line-height source] | [usage and heading semantics] | [rule] |
| Section title | [source] | [usage and semantics] | [rule] |
| Body | [source] | [usage and readable measure] | [rule] |
| Label / help / metadata | [distinct adopted roles] | [usage] | [rule] |
| Data / metric | [role and numeric formatting] | [usage if applicable] | [rule] |

Keep semantic heading level independent of visual size. Define emphasis within each local decision group, supporting-action treatment, and essential information that stays visible. Preserve priority in narrow layouts and at enlarged text sizes.

## Visual identity

| Family | Adopted meaning and treatment | Canonical binding |
| --- | --- | --- |
| Canvas, surfaces, text, borders | [role relationships and theme pairings] | [source] |
| Actions, selection, feedback, focus | [meaning and state treatment] | [source] |
| Radius, border width, elevation, layering | [role usage and allowed variations] | [source] |
| Icons | [family, sizes, stroke, label/alignment rules] | [assets/components] |
| Imagery | [purpose, crop/aspect/fallback/alternative-text rules] | [assets/components] |

Specify when grouping uses whitespace, dividers, surfaces, or elevation. Keep supported themes intentional. Record justified exceptions; do not substitute palette values by visual similarity.

## Content and truncation

Resolve the policies below for the product. Keep task-critical meaning readable and provide full-content access where truncation is adopted.

| Content role | Wrap / clamp / truncation policy | Full-content path and evidence |
| --- | --- | --- |
| Titles, labels, action text | [readable composition policy] | [long/translated content check] |
| Instructions, errors, validation, critical notifications | [complete visible message policy] | [narrow/zoom check] |
| Names in dense collections | [conditions; items remain distinguishable] | [keyboard/touch reveal or detail path] |
| Descriptive previews | [permitted line clamp and context] | [expansion/detail path] |
| Identifiers, paths, URLs | [identifying segments and growth policy] | [full reading and copying as needed] |
| Amounts, units, dates, status | [comparison-critical information policy] | [format/detail behavior] |

Preserve the complete value. Do not rely solely on browser `title`, mouse hover, or an accessible name to expose visually truncated information. Exercise near-identical long values, unbroken strings, localization, empty content, and zoom.

## Page and interaction patterns

| Pattern | Canonical implementation / example | Stable layout and content decisions | Variants and behavior |
| --- | --- | --- | --- |
| [page shell/header or actual page type] | [path] | [width/gutters/hierarchy/actions] | [responsive/state rules] |
| [form/collection/detail/feedback pattern used here] | [path] | [grouping/density/content] | [actual variants/states] |

For each relevant interaction, record trigger/outcome, state ownership, applicable states, pointer/keyboard/touch semantics, focus movement, validation timing, feedback location and persistence, and recovery/undo/cancellation. Identify the actual data integration or explicitly label simulated behavior. Reuse the same vocabulary and placement for equivalent tasks.

## Loading and async contracts

Resolve only operations the product actually supports. Use shared indicators and feedback patterns with feature-owned request state.

| Operation | Visible content and feedback | Interaction / state preservation | Failure, retry, or completion |
| --- | --- | --- | --- |
| Initial load | [available shell/content; skeleton or progress policy] | [usable unrelated controls; status/focus] | [empty/result/error and next action] |
| Refresh | [valid retained data and refresh feedback] | [freshness/identity policy; focus/selection] | [stale-data indication and recovery] |
| Mutation | [local pending and resulting state] | [duplicate guard, edits/input retention] | [validation/error/success; safe retry/reconciliation] |
| Pagination | [retained items and scoped progress] | [scroll/focus/query identity] | [deduplication, end, retry] |

Identify request ownership and how obsolete results are ignored. Distinguish missing data from loading, no results, permission failure, and offline/error states where applicable. Document busy-region and announcement placement, truthful progress, actual cancellation support, and optimistic reconciliation if used. Keep loading/result geometry deliberate without delaying ready content or clipping text.

## Motion contract

| Pattern / purpose | Trigger and animated properties | Duration/easing binding | Interruption / repeated action | Reduced-motion equivalent |
| --- | --- | --- | --- | --- |
| [feedback/expansion/overlay/navigation actually used] | [trigger/properties] | [tokens with defined values at source] | [behavior] | [equivalent information and control] |

Define concrete duration/easing roles in the canonical source. Keep motion purposeful, brief for the context, and responsive to user input. Keep completion logic independent of decorative animation events. Specify truthful determinate/indeterminate progress and applicable pause/stop controls for ongoing movement.

## Verification and reference screens

- Reference screen/flow: [path and user task]
- Foundation rules and patterns demonstrated: [IDs and bindings]
- Content/state variations: [long, empty, pending, failure, recovery, localized, large as relevant]
- Contexts checked: [viewports/container widths and change boundaries, themes, input methods, zoom/motion preferences]
- Shared implementation evidence: [representative page-to-component-to-token trace; affected consumers]
- Remaining hypotheses or evidence limits: [what has not been established]

| Enforcement | Actual implementation / command | Coverage and manual remainder |
| --- | --- | --- |
| Token / style rules | [actual configured check or manual review] | [limits] |
| Component API / behavior | [types and targeted existing tests] | [limits] |
| Accessibility | [automation and interaction checks] | [limits] |
| Visual consistency | [reference screens / existing regressions] | [design critique required] |

For a new page/component, report applicable rules as Pass, Fail, Not verified, or Exception with actual evidence. Review task clarity, hierarchy, grouping, content resilience, interaction/recovery, motion, and visual identity. Do not infer usability, accessibility conformance, or mechanical enforcement from the existence of this document.

## Changes and exceptions

- Extension rules: [when to add a semantic role, variant, or reusable pattern]
- Shared change impact: [consumers, examples, documentation, and checks to update]
- Compatibility/migration policy: [for changes to established public contracts]

| Exception | Rule and scope | User need / constraint | Chosen alternative | Revisit/removal condition |
| --- | --- | --- | --- | --- |
| [ID when needed] | [rule/component/page] | [specific reason] | [choice and implications] | [condition] |

Keep an exception bounded; do not silently promote it into a new default. Record meaningful foundation changes here or in the project's existing change record. Preserve user-authorized decisions and avoid adding approval gates for routine implementation.
