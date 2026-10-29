# Visual foundations

Turn these rule families into concrete project decisions before repeating a new visual pattern. Preserve an existing foundation and its names. Treat the recommendations here as project standards to adopt and refine; distinguish them from the accessibility requirements linked below. Do not describe any palette, spacing scale, typeface, or aesthetic as a universal FAANG standard.

## Contents

- [Spacing and composition](#spacing-and-composition)
- [Responsive contracts](#responsive-contracts)
- [Typography](#typography)
- [Hierarchy and action emphasis](#hierarchy-and-action-emphasis)
- [Visual style](#visual-style)
- [Content, overflow, and truncation](#content-overflow-and-truncation)
- [Review the assembled page](#review-the-assembled-page)

## Spacing and composition

### SPACE-01: Define relationships, then assign scale values

Use the approved scale for repeated design spacing. Record the actual token or component default for icon-to-label, label-to-control, control-to-help/error, field-to-field, group-to-group, section-to-section, container padding, and page gutters. Distinguish these relationships even when some currently share a value.

Express relationships through tokens, governed layout primitives, or existing component defaults; do not require another semantic alias for every gap. Keep legitimate structural values such as zero and `auto`. Use the established scale instead of introducing an adjacent arbitrary value to make one screenshot fit.

Use [Carbon's spacing guidance](https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview) as an example of a finite scale used within and between components. Adopt values for the actual product, rather than copying its scale blindly.

### SPACE-02: Give each boundary one spacing owner

Let the parent layout own gaps between siblings. Let a component own its internal padding and relationships. For example, a form owns gaps between fields; each field owns its label, control, and message gaps; a panel owns its inner padding. Preserve an established alternative contract if the project already has one.

Prefer parent `gap` for repeated rows or stacks when suitable. Avoid accidental double spacing from adjacent child margins. Keep a reusable button or card free of page-specific external spacing. Put that placement decision in the page layout or a named composition pattern.

```css
/* Illustrative names: map to the project's existing tokens. */
.form { display: grid; gap: var(--space-field-stack); }
.field { display: grid; gap: var(--space-field-content); }
.panel { padding: var(--space-panel-inset); }
```

### SPACE-03: Encode grouping and rhythm

Keep related content closer together than separate groups by default. Maintain equal spacing for equivalent relationships in a list, table, or repeated card pattern. Increase separation deliberately at section boundaries. Review the result visually; a mathematically regular scale can still produce poor grouping.

Use alignment and whitespace to express relationships before adding another divider, border, or background. Make optical adjustments at the owning primitive or component where reusable; explain a necessary local exception. See [Atlassian's proximity, hierarchy, rhythm, and optical-adjustment guidance](https://atlassian.design/foundations/spacing).

### SPACE-04: Reuse composition patterns

Reuse the project's equivalents of a vertical stack, wrapping inline group, grid, constrained container, section, and page header. Use CSS patterns when separate components add no value. Specify each pattern's gap, alignment, wrapping, width constraints, and responsive transitions once.

Keep page gutters and main alignment lines consistent across sibling pages. Align labels, fields, headings, and actions to intentional edges. Do not force every feature into a card when the existing page structure already groups it clearly.

### SPACE-05: Define responsive and density behavior centrally

Map page gutters, section spacing, grid columns, and control density to actual content pressure. Keep equivalent layouts on the same rules. Change layout before compressing readable text or removing important content. Define compact and comfortable variants only when the product needs them.

Allow children to shrink or wrap where appropriate, including suitable `min-inline-size` constraints in flex/grid layouts. Keep inherently wide data views scrollable within a deliberate region while preserving usable surrounding controls. Do not hide document overflow to conceal a layout defect. Apply the responsive contracts below at the owning component or layout pattern, so every consumer inherits the behavior.

### SPACE-06: Bootstrap once when no foundation exists

Use an explicitly provisional mapping, prove it on representative content, and record the adopted result. For example, a new web product could start with a scale of `4, 8, 12, 16, 24, 32, 48, 64` CSS px at a 16px root, implemented with suitable relative units.

| Relationship | Illustrative starting value |
| --- | --- |
| Icon to label / label to control | 8px |
| Control to help/error | 4px |
| Field to field | 16px |
| Field group to group | 24px |
| Panel inset | 24px |
| Major section separation | 32px |
| Page gutter | 16px narrow, 24px wide |

Treat these numbers as an example, not an accessibility requirement, mandatory grid, or instruction to replace an existing scale. Adjust them once for the product's density, typography, and content; do not select a fresh mapping on every page.

## Responsive contracts

Make responsiveness part of each component's supported behavior before reusing it. Adapt the same task and visual relationships to available space. [Apple's layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout) emphasizes familiar structure across window changes, text sizes, and localization; apply that principle through web layout tools and the project's own visual identity.

### RESPONSIVE-01: Adapt to the space the component receives

Record the owning container, useful width constraints, wrapping/stacking behavior, overflow policy, and any structural transition. A component in a sidebar can need a compact layout even on a wide screen. Start with intrinsic flex/grid layout, wrapping, and appropriate min/max constraints; introduce a breakpoint when the composition needs a discrete change. Preserve adopted thresholds and add a new one only for an observed layout need.

Use viewport queries for viewport-dependent shells and [container size queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries) for reusable content that must respond to its containing region, when supported by the project's browser targets. Do not require container queries when intrinsic layout is sufficient. Keep these rules at the reusable component/pattern instead of copying page-specific patches.

### RESPONSIVE-02: Preserve the task and meaningful order

Define what remains visible, what wraps or stacks, and what moves behind a clearly available disclosure. Keep essential information and actions accessible at every supported size. Preserve meaningful DOM, reading, and keyboard order when the composition changes. Do not duplicate active controls for narrow and wide layouts; if separate presentations are necessary, expose only the active one and retain consistent state and focus.

Adapt tables and other inherently wide views deliberately using their content policy. Do not remove critical columns or actions merely to eliminate scrolling. Apply TYPE-03 and CONTENT-01 through CONTENT-04 to expanded text and localized content; a fixed-height container must not clip them.

### RESPONSIVE-03: Include input and constrained viewport behavior

Check keyboard, touch, and pointer access independently of width. Do not assume a wide viewport has a mouse or a narrow one has touch. Keep essential actions available without hover, retain usable target spacing, and provide the adopted touch alternative for supplemental disclosures.

Constrain overlays to available width and height and keep their content and dismissal reachable. Inspect sticky headers, bottom actions, and focused fields when zoom or an on-screen keyboard reduces visible space. Respect applicable safe-area insets for edge-attached UI. Use the established overlay and focus contract rather than inventing a mobile-specific interaction model on each page.

### RESPONSIVE-04: Inspect the range and representative containers

For a new reusable pattern, inspect narrow and wide contexts, an intermediate width, and both sides of any changed structural breakpoint. Reuse existing supported viewport fixtures where suitable. For a component intended for different containers, exercise at least two representative placements. Include applicable long-content, loading, and error states; select combinations by the change's risk rather than testing every permutation for every edit.

Apply the selected accessibility checks separately. [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) includes 320 CSS px for vertically scrolling content, with specific exceptions for content requiring two-dimensional layout; the verification guide preserves the full criterion and related zoom checks. A project breakpoint or a single mobile screenshot does not establish conformance.

## Typography

### TYPE-01: Use a finite set of complete text roles

Define roles for the titles, headings, body content, labels, supporting text, and metrics the product actually uses. Specify family/fallbacks, size, weight, line height, and tracking where relevant. Reuse complete roles instead of independently selecting font size and weight on each screen.

Keep numeric treatments deliberate for data: align comparable values and use the project's numeric formatting and tabular-digit conventions where useful. Keep helper text readable; secondary importance does not justify failing contrast. Use [Carbon typography](https://www.carbondesignsystem.com/building-blocks/foundations/typography/overview) as an example of coordinated type roles serving different content contexts.

### TYPE-02: Separate semantic level from visual size

Choose heading elements from the document structure, then apply the appropriate visual role. Preserve a meaningful outline and descriptive section names. Do not use a heading solely to obtain a font size, or replace a semantic heading with a bold paragraph for convenience.

Expose the relationships that the visual design communicates. Check semantic structure and descriptive wording separately; they address distinct requirements. See [WCAG 1.3.1](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) and [WCAG 2.4.6](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html).

### TYPE-03: Define reading width and text growth

Set a comfortable prose measure as a product decision, separate from the width of tables and other data views. Treat character-count heuristics as language- and font-dependent. Test the product's actual language and content instead of treating a Latin-script line-length recommendation as universal.

Preserve hierarchy under text resizing, wrapping, and narrow layouts. Avoid fixed text-container heights that clip additional lines. Keep the meaning intact under the text-spacing overrides and zoom checks in the verification reference. See [Atlassian applying typography](https://atlassian.design/foundations/typography/applying-typography) for coordinated hierarchy and reading-width guidance.

## Hierarchy and action emphasis

### HIER-01: Establish the information order

Identify the screen's user task, orientation/context, primary content, supporting information, and metadata before styling. Give the most useful information and actions suitable prominence and placement. Use size, weight, grouping, alignment, and whitespace together; avoid making every panel or label equally emphatic.

Preserve the priority when the layout changes. Keep DOM, reading, and focus order meaningful; do not use visual rearrangement to create a confusing keyboard sequence.

### HIER-02: Assign action emphasis within a decision group

Give the main action in a local task or decision group the strongest appropriate treatment. Distinguish secondary, subtle, and destructive actions with established variants. When choices have equal priority, avoid manufacturing a preferred choice through arbitrary emphasis.

Do not interpret this as exactly one primary button across an entire application page. A page can contain independent tasks. Keep dangerous actions recognizable and appropriately separated without making them the default focal point. Use [Fluent's button guidance](https://fluent2.microsoft.design/components/web/react/core/button/usage/) as a reference for differentiated prominence, while retaining the product's placement and language conventions.

### HIER-03: Keep essential support discoverable

Keep instructions, constraints, errors, and state needed to complete the task visible in context. Use progressive disclosure for secondary details, with a clear way to reveal them. Do not hide critical task information in a tooltip or use low contrast to suppress it.

Make navigation, page headers, section headers, and action groups behave consistently across equivalent pages. Review a new screen beside an existing representative screen before accepting a new pattern.

## Visual style

### STYLE-01: Give surfaces and emphasis explicit roles

Define how canvas, content surfaces, selected regions, overlays, borders, and feedback appear in supported themes. Reserve accent and status treatment for their established meanings. Use the same role for the same meaning across pages, even when another palette value appears visually similar.

Specify where separation uses spacing, a divider, a surface change, or elevation. Avoid adding all four by habit. Check text/background pairs and state visibility in actual rendered contexts; refer to the tokens and verification guides for technical checks.

### STYLE-02: Govern shape and depth

Define radii by relevant roles such as controls, panels, and overlays, plus a finite border/elevation scale. Reuse those roles. Make shadows communicate layering or interaction where appropriate, and preserve usable boundaries without relying only on shadows.

Keep layered elements connected to the existing stacking strategy. Do not fix one overlay with an arbitrary larger z-index without inspecting its stacking context and the affected overlay patterns.

### STYLE-03: Keep icons and imagery coherent

Use the approved icon family, size roles, stroke treatment, and alignment conventions. Preserve recognizable meanings and accessible names; do not replace a necessary label with an unfamiliar icon. Match optical size, not just nominal SVG dimensions.

Record imagery's purpose, aspect ratio, crop behavior, and fallback. Preserve meaningful image content when cropping; handle unavailable images without breaking layout. Provide appropriate text alternatives and treat decorative imagery accordingly. Use the existing assets and image components before introducing another visual language.

## Content, overflow, and truncation

### CONTENT-01: Define overflow behavior per content role

Prefer flexible layout and wrapping before truncating. Establish each role's growth, overflow, and full-content access policy. Treat the following as recommended project standards to adapt to real task needs:

| Content role | Default policy |
| --- | --- |
| Page/section title, field label, action label | Keep readable; wrap or adjust the composition rather than cutting off meaning. |
| Instructions, validation, errors, important notifications | Show the complete message in context. |
| Names in dense lists, trees, or tables | Permit truncation only if items remain distinguishable and full content is accessible. |
| Preview descriptions | Permit a defined line clamp with a clear expansion or detail path. |
| Identifiers, paths, URLs | Preserve identifying segments where needed; provide full-value reading and copying when relevant. |
| Prices, amounts, units, dates, status | Preserve information needed for comparison and decisions; use deliberate formatting or a detail path. |

See [Carbon overflow content](https://www.carbondesignsystem.com/building-blocks/core/patterns/overflow-content) for its restrictions on critical text and [Fluent tree guidance](https://fluent2.microsoft.design/components/web/react/core/tree/usage/) for preserving differentiation between truncated items.

### CONTENT-02: Preserve the full value and a usable reveal path

Keep full text in the data and appropriate accessible representation. Do not destructively slice user content merely to fit a container. For an approved truncated role, specify how a sighted keyboard user and a touch user can read the full content, such as an expansion control or existing detail view. Provide copying when the task requires the exact value; copying alone is not always a reading solution.

Test near-identical names and identifiers. If truncation hides the only distinguishing segment, change the presentation rather than expecting users to inspect every item. Do not assume that a screen reader receiving the full string solves access for other users.

### CONTENT-03: Use tooltips as supplemental UI

Use an existing accessible tooltip for suitable short, non-interactive supplemental text. Keep essential task content visible. Provide keyboard access and an appropriate touch alternative. Do not rely on the browser `title` attribute as the sole reveal mechanism; see its [documented access limitations](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/title#accessibility_concerns).

Meet the applicable hover/focus requirements for dismissibility, hoverability, and persistence, including their stated exceptions. Use a suitable disclosure/popover pattern when content contains interactive controls. See [WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) and [Atlassian tooltip usage](https://atlassian.design/components/tooltip/usage).

### CONTENT-04: Verify realistic content extremes

Exercise long and empty text, unbroken identifiers, large and negative numbers, localization, missing media, and repeated items as relevant. Check that labels and actions remain understandable after wrapping. Use the project's locale and time-zone contracts; do not conflate a date-only value with a timestamp.

Keep critical table data accessible on narrow screens through deliberate scrolling, details, or an equivalent presentation. Do not remove useful columns solely to manufacture an overflow-free screenshot. Avoid fixed heights that hide expanded messages or translated text.

## Review the assembled page

Trace the adopted rule IDs to their actual tokens, component variants, and layout patterns. Inspect spacing relationships and alignment lines, not only individual token names. Compare a new screen with an established representative screen for equivalent tasks.

Check the reading and action hierarchy with realistic content, then inspect supported layouts, container placements, and themes. Verify truncation and reveal behavior with keyboard and touch where relevant. Look for observable defects: inconsistent baselines or icon scale, cramped action groups, awkward text wrapping, clipped focus rings, shifting controls during loading, and abrupt layout transitions. Fix the relevant defect and inspect the result again.

Record concrete exceptions at their owning pattern, and correct a shared cause before copying the deviation into another page. Report actual evidence; static rule compliance does not establish visual quality by itself.
