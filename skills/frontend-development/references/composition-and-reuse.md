# Composition and reuse

Make the project foundation executable. Reuse actual tokens, styles, components, and behavior, then compose them into the requested experience. A document listing reusable parts does not establish reuse if each page still implements its own copy.

## Contents

- [Use a layered architecture](#use-a-layered-architecture)
- [Find the existing implementation first](#find-the-existing-implementation-first)
- [Assign ownership and boundaries](#assign-ownership-and-boundaries)
- [Carry the complete contract into each use](#carry-the-complete-contract-into-each-use)
- [Compose a real feature](#compose-a-real-feature)
- [Keep the catalog useful](#keep-the-catalog-useful)
- [Verify reuse and evolve the source](#verify-reuse-and-evolve-the-source)

## Use a layered architecture

Map these conceptual layers onto the existing codebase. Preserve its names and folders; do not require atomic-design terminology, one file per layer, or a new component package.

| Layer | Owns | Examples |
| --- | --- | --- |
| Primitive tokens | Foundational values and scales. | Palette, spacing scale, type values, radii, motion durations/easings. |
| Semantic tokens | Meaning and supported theme/mode mappings. | Text, surface, action, focus, feedback roles. |
| UI and layout primitives | Small visual, semantic, and interaction contracts using those tokens. | Button, input, text role, icon, stack, wrapping action group, container. |
| Composed components and patterns | Repeated relationships and behavior built from smaller parts. | Form field, search toolbar, dialog composition, settings section, collection states. |
| Feature compositions | Product-specific data, rules, and task coordination built with the system. | Profile editor, project list, invitation flow. |
| Pages and routes | Task structure, navigation, data boundaries, and assembly of applicable features/patterns. | Account settings page, projects page. |

Keep component-specific token aliases optional, as described in the tokens reference. Consume semantic colors by meaning; use the approved spacing/size scales directly where appropriate. Tokens are data; a component adds semantics, content, behavior, and layout. Do not equate a raw token value with an accessible UI primitive.

Compose higher levels from suitable lower levels. A page may use a primitive directly when no useful intermediate pattern exists. Implement primitives with the project's native controls, existing accessible library, CSS utilities, or framework components as appropriate. Do not wrap every HTML element or rebuild a library component merely to complete the table.

Plan from the user task down to the required parts, then implement missing foundations and compose upward. Build only the coherent subset needed for the current feature. Prove it in a real screen before expanding an imagined universal kit. React's [component hierarchy guidance](https://react.dev/learn/thinking-in-react) illustrates decomposition, composition, and state ownership; apply the same reasoning through the project's actual framework.

## Find the existing implementation first

Before creating a component or styling a repeated pattern:

1. Search the project catalog, exports, related screens, styles, and installed UI library by purpose as well as name. Inspect the implementation and a representative consumer.
2. **Reuse** the existing API when its meaning, behavior, and constraints fit.
3. **Extend** its documented variant or contract when a real reusable distinction is missing and compatibility can be preserved.
4. **Compose** existing parts when the need is a new relationship or task pattern.
5. **Create locally** when the need is distinct or currently specific to one feature. Promote it when its responsibility is stable and sharing is useful.

Choose the smallest suitable option. A native control or behavior-heavy widget can justify extraction on its first use because its accessibility and state contract needs one owner. Conversely, two visually similar blocks may serve different tasks and need separate compositions. Avoid both copy-and-paste divergence and speculative abstraction.

Reuse implementation, not a second pasted copy with renamed classes. If similar implementations already exist, converge the affected scope when justified and report remaining migration needs. Do not expand a page request into an unrelated application rewrite.

## Assign ownership and boundaries

- Keep shared primitives independent of specific routes, service endpoints, and feature domain models. Supply content, state, and events through a small explicit API. Let feature/controller code or the established data layer coordinate requests and business rules.
- Let a reusable component own its internal layout, supported visual states, focus treatment, and relevant motion. Let its parent own placement and sibling spacing. Keep responsive transitions at the smallest shared owner that understands them.
- Let a form-field composition own label/help/error relationships; let the form or feature own the actual validation policy and submitted data. Let a button render pending feedback and guard activation according to its contract; let its request owner decide when an operation begins, completes, fails, or can be retried.
- Use content slots, children, events, and finite named variants for genuine variations. Preserve required native attributes, refs, form participation, and semantics. Do not create invalid nesting through polymorphic or slotted APIs.
- Keep a shared state value with the existing common owner and derive values that can be computed. Do not mirror props into local state merely to make a component reusable. Respect legitimate controlled/uncontrolled contracts and existing framework conventions.
- Keep page-specific placement in the page or layout pattern. Extend a shared visual contract through its supported API or source; avoid descendant selectors that reach inside a component and restyle its internals per route. Preserve useful established escape hatches, but document a deliberate contract exception.

Reuse the project's architecture; these responsibilities do not require one state library, styling system, or directory structure. A small static site can share canonical styles and patterns without introducing a JavaScript component framework.

## Carry the complete contract into each use

Use the contract in [Components and states](components-and-states.md). Include applicable responsive behavior, content growth/truncation, keyboard/focus semantics, pending/error/recovery behavior, and motion/reduced-motion behavior when the part is introduced. Implement these at the owning layer so consumers inherit them instead of repairing each page separately.

For example, a reusable button carries its appearance variants, native semantics, focus treatment, label growth, activation guard, stable pending layout, and motion policy. A settings section carries its title/action grouping and narrow-container stacking. The feature supplies the specific action, data, and recovery wording. Do not give every presentational component its own fetching machinery or force every component to implement every async state.

Responsiveness is required for every new page and reusable component in supported web contexts. Specify the available width, wrapping, constraints, and transformations; inspect both relevant isolated contexts and the assembled page. A component that works only at one desktop viewport has an incomplete layout contract.

Make a deliberate motion decision for each relevant transition: use an adopted purposeful transition or immediate state change. Store timing/easing at the shared source and implement the reduced-motion equivalent with the same information and control. Treat no animation as a valid design choice. Loading feedback must follow the real operation; appearance alone cannot make a state truthful.

## Compose a real feature

For two settings pages with different business data, an appropriate ownership map could be:

| Reused implementation | What both pages inherit | What stays with each feature |
| --- | --- | --- |
| Page shell and header | Gutters, content width, title role, action wrapping. | Title, route context, available actions. |
| Settings section | Grouping, section spacing, heading/action alignment, narrow layout. | Section content and task-specific restrictions. |
| Form field + input | Label/help/error associations, internal gaps, control states, text growth. | Value, validation rules, specific error message. |
| Action group + button | Emphasis, spacing, focus, pending feedback, activation guard, motion. | Save operation, request status, success/recovery outcome. |

Both pages use the same implementations; improving a shared field's error layout reaches both consumers. The second page adds domain composition and only genuinely missing variants. Apply the corresponding pattern for a dashboard, collection, storefront, or content site; do not force unrelated experiences into this settings example.

## Keep the catalog useful

Keep a small inventory in the existing foundation, component docs, or gallery. Record the canonical path/export, purpose, public variants/slots, key dependencies, applicable states/width constraints, and representative consumer or example. Link to types, stories, and source for detail rather than copying all implementation documentation.

Make newly adopted parts discoverable before the next page is built. Record the decision to reuse, extend, compose, or keep local in the existing working note or change summary. A project-wide registry service, generated catalog, Storybook installation, or public style-guide route is unnecessary unless the task justifies it.

## Verify reuse and evolve the source

- Trace a representative page element through its feature/composite, shared primitive, and token source. Confirm that the page actually imports or applies the canonical implementation and has no unexplained bypass of its internal contract.
- Inspect comparable uses for duplicated styles, focus/error logic, loading treatment, responsive patches, or motion constants. Correct shared causes at their owner.
- Exercise the affected part in the requested screen and relevant existing consumers. If it is reused at different container widths, verify those contexts. For multi-page work, compare the requested pages together; do not create an unrelated page merely to demonstrate reuse.
- Recheck applicable states after a shared change, including text growth, pending-to-result transitions, interruption, and reduced motion. A component-level pass does not establish correct semantics or focus order in every composition.
- Change tokens, APIs, patterns, examples, and documentation together when the contract changes. Preserve compatibility or make a migration explicit. Claim automated enforcement only when the actual project check exists and has run.

Use the verification reference for evidence and honest limits. Separate architectural reuse from visual and interaction quality: both need inspection in the finished product.
