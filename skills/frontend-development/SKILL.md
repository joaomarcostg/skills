---
name: frontend-development
description: Build frontend experiences from a persistent design foundation, composing tokens into reusable primitives, components, patterns, and pages. Use for web UI creation or changes, design systems, component reuse, responsive layouts, loading and recovery states, spacing, typography, hierarchy, visual style, truncation, UX, accessibility, and motion. Load the project's adopted rules, extend its shared implementations, and verify the finished experience. Preserve the existing stack, with guidance for React, Next.js, SvelteKit, CSS, and Tailwind. Scale work to the request; exclude backend-only work and standalone illustration creation.
---

# Frontend Development

Establish a durable project design foundation and apply it consistently to every new page and component. Build from primitive values and semantic tokens into reusable UI/layout primitives, composed patterns, feature compositions, and pages. Carry design decisions and behavior through shared code so each new screen benefits from the existing system.

## Operating rules

- Follow the user's scope and the workspace instructions. Inspect existing work before editing; preserve unrelated changes and established public APIs.
- Reuse the existing design system, components, dependencies, package manager, and framework version. Extend an established system at its source. Do not create a parallel token palette or migrate the stack incidentally.
- For a new product, define the smallest coherent system that supports the requested experience. Choose a visual direction from the audience, content, brand, and references; do not apply a fixed aesthetic to every product.
- Keep design and implementation connected: name the canonical token source, consumers, component variants, supported states, and verification evidence.
- Before changing UI, reload the project's foundation and applicable patterns from their source. Treat adopted rules as the default implementation contract across tasks; do not silently redefine spacing, typography, truncation, motion, or interaction behavior on each page.
- Make responsiveness part of every new page/component contract. Define applicable loading, recovery, accessibility, and motion behavior at its reusable owner; consumers inherit it. Choose purposeful animation or an immediate transition deliberately.
- Distinguish accessibility requirements, adopted product rules, and provisional defaults. Adapt public design-system guidance to the product; do not claim a universal FAANG aesthetic, spacing scale, or internal design process.
- Make reasonable, reversible assumptions and proceed. Ask only when missing information materially changes the product, conflicts with a supplied design, or blocks access. Do not insert approval gates between routine stages.
- Use this skill alongside applicable design-tool, hosting, and repository workflows. Creating UI does not itself authorize publishing it, buying assets, or changing production access.

## Choose the right depth

| Request | Required work |
| --- | --- |
| Copy change or isolated visual fix | Identify the existing component and tokens; make a local change; inspect affected behavior and layout. Keep the design decision in the response or existing documentation. |
| New page, component, or interaction | Load the foundation; search the component catalog and real consumers; reuse, extend, or compose existing parts; specify missing responsive/state contracts; implement and exercise the complete interaction. |
| Shared token, theme, or foundational component change | Trace consumers; document the contract change; check representative dependent screens, states, and supported themes. |
| New frontend or explicit system creation | Establish a compact design contract, implement tokens and required primitives, prove them on one representative screen, then expand. |

Do not turn a small fix into a design-system project. Do not add Storybook, a token compiler, a component library, or a test framework just to satisfy a checklist.

## 1. Inspect and establish the starting point

1. Read applicable repository instructions and inspect the working tree. Locate the actual application root before running commands.
2. Read manifests and lockfiles to identify framework and styling versions, scripts, supported browsers, and existing checks. Find the entry stylesheet, resets, theme selectors/providers, token sources and generated outputs.
3. Find the project foundation, components, variants, patterns, typography, icons, assets, and component gallery. Read the foundation and relevant rules for this task, including their source bindings and exceptions. Search with `rg`; inspect representative consumers rather than scanning the entire repository indiscriminately.
4. Inspect supplied designs and the current rendered screen when accessible. Treat screenshots as evidence of appearance; identify missing states and responsive behavior instead of inventing certainty about them.
5. Identify the user task, data contract, routes, supported locales/themes, and the real interaction to implement. Distinguish real integrations from demonstrative data.
6. State a short working plan: what will be reused, what is missing, the affected scope, and how the result will be checked. Continue into implementation.

If no project is supplied, use the requested environment's normal creation workflow. Choose a stack only when creating a project is authorized; do not infer that every future project uses the same framework.

## 2. Establish and load the project foundation

Read [Foundation governance](references/foundation-governance.md) when establishing the system, extending it, or resolving a rule conflict. For an established system, reuse its canonical foundation and record only the delta. For a new system, or a new page/component in an undocumented system, adapt [the design contract template](assets/design-system-contract.md) into the existing documentation location, or `docs/design-system.md` if none exists. Capture the decisions required by the current scope; an isolated repair does not require documenting an entire application.

Make the foundation a durable input to future work. Give applicable rules stable identifiers, concrete decisions or source bindings, scope, implementation mechanisms, and verification methods. Mark unresolved decisions as provisional; replace applicable template placeholders before calling the foundation adopted. Connect the foundation to the existing project documentation entry point so the next task can find it.

Specify the following before implementing multiple screens:

- **Product intent:** audience, primary task, content hierarchy, language, and the information that must be visible without interaction.
- **Visual direction:** concrete choices for type hierarchy, density, spacing rhythm, surfaces, emphasis, imagery, and icon treatment. Explain how they serve the task. Match supplied brand assets and references.
- **Foundations:** colors by role, typography, spacing, layout widths, responsive changes, radii, borders, elevation, layering, and motion where needed.
- **System ownership:** canonical token source, generated artifacts, theme mechanism, component/pattern catalog, dependency and state ownership, and relevant commands.
- **Interaction contract:** needed components, variants, states, keyboard behavior, validation, recovery paths, and narrow-screen behavior.
- **Acceptance evidence:** the representative screen or flow, states/themes/viewports to inspect, and relevant existing checks.

Use [Visual foundations](references/visual-foundations.md) to define spacing relationships, layout ownership, text roles, hierarchy, visual treatment, and content overflow. Use [Interaction and motion](references/interaction-and-motion.md) to define consistent UX, feedback, accessibility, and animation behavior. Load the relevant sections when applying or extending those rules.

| Rule family | Decisions every applicable implementation must inherit |
| --- | --- |
| Spacing and composition | Label/control gaps, field/group/section separation, gutters, internal padding, parent-owned gaps, density and responsive mappings. |
| Responsive behavior | Available container width, intrinsic constraints, wrapping/stacking, adopted breakpoints, input capabilities, essential content/actions, and focus continuity. |
| Typography and hierarchy | Named text roles, semantic heading structure, content priority, action emphasis, readable widths. |
| Visual identity | Semantic color usage, surface and elevation roles, radii, borders, icon and imagery treatment. |
| Content and truncation | Which content wraps, which may truncate, how full content is accessed, and how long/localized content behaves. |
| UX and accessibility | Shared navigation/form/feedback patterns, states, validation timing, recovery, focus, keyboard and touch behavior. |
| Loading and continuity | Initial load, refresh, mutation, and pagination policies; valid retained data, stable geometry, request ownership, status, and recovery. |
| Motion | Purpose, trigger, properties, duration/easing roles, interruption, and reduced-motion equivalent. |

Keep canonical values in executable token sources. Let documentation explain meaning and usage; avoid a second handwritten copy of every token value. Preserve design intent across sizes instead of simply shrinking a desktop composition. Reuse an adopted rule or extend it at its source; handle a justified exception explicitly with its scope and reason. Do not silently convert an exception into a new default.

## 3. Define or extend tokens

Read [Tokens and themes](references/tokens-and-themes.md) before creating or changing shared tokens, theme behavior, or token generation.

1. Choose one editable authority. For a small web app, existing CSS custom properties may be sufficient; use DTCG JSON when actual interchange or generation needs justify it.
2. Separate foundational values from semantic roles. Let components consume semantic color roles; use component-specific tokens only when they provide a useful independent contract. Keep established spacing and size scales directly usable.
3. Define foreground/background pairs and the states that need different treatment. Add only the foundations, modes, and variants needed by the task.
4. Map the source through the existing styling mechanism. Inspect actual dependency versions before selecting syntax; use [Framework integration](references/framework-integration.md) for relevant adapters.
5. Resolve aliases and inspect theme scope, inheritance, overlays, and first render. Validate the actual selected format and toolchain, not a guessed schema.
6. Inspect changed consumers for duplicated design values and bypassed tokens. Allow structural CSS, data-driven geometry, and justified one-off art direction; do not manufacture a token for every number.

If an existing library already defines role names, preserve them. Do not rename everything to match examples in this skill.

## 4. Compose reusable components and their contracts

Read [Composition and reuse](references/composition-and-reuse.md) when adding a page/component or changing shared architecture. Search the catalog, source, and representative consumers before creating anything: reuse a suitable part, extend its contract, compose existing parts, or keep a genuinely specific part local. Read [Components and states](references/components-and-states.md) for the applicable layout, semantics, state, and behavior contract.

- Reuse accessible primitives already in the project. Specify the semantic element, public API, variants, sizes, token mapping, supported states, and keyboard behavior before proliferating instances.
- Prefer explicit variant choices to contradictory booleans. Separate reusable presentation from feature-specific business logic where it improves clarity.
- Model loading, empty, validation, failure, success, permission, and long-content states only where applicable. Distinguish initial load, valid-data refresh, mutation, and pagination; specify transitions, stale-data policy, focus, announcements, and recovery.
- Define field labels, helper/error associations, focus management, status announcements, and disabled/pending behavior together with styling.
- Keep reusable components in the project's existing location and catalog. Extract for meaningful repetition, behavior, or a stable interface; do not wrap every element or create speculative abstractions. Keep shared primitives independent of feature routes and data services.
- Bind repeated spacing and behavior to existing layout patterns and component APIs. Keep the parent responsible for placement and sibling gaps, and the component responsible for its internal relationships, unless the project explicitly adopts another ownership model.
- Record the applicable foundation rule IDs in the component's existing documentation, example, or implementation note when adding a reusable contract. Specify its available-space behavior, content overflow, motion, and reduced-motion equivalent. Keep page assembly from overriding component internals.
- Add stories or examples to an existing component gallery when useful. Do not install a gallery or expose a production style-guide route without a task need.

## 5. Prove the system on a representative slice

For a new system, a redesign, or a substantial shared change, implement one real screen or flow that exercises the important foundations before expanding. Prefer a slice with meaningful content and interaction, such as a form with validation or a dense list with filters.

Inspect its hierarchy, typography, rhythm, contrast, component states, and responsive layout. Check that intended tokens reach the rendered elements. Perform the design critique in the governance reference: judge the user task, information priority, grouping, content resilience, visual identity, and interaction cost as well as token compliance. Fix shared causes in tokens/components before duplicating the pattern across screens. Reuse an existing representative screen for a shared-system change; do not build an unrelated demo.

Skip this separate stage for an isolated fix when the affected element already provides sufficient evidence.

## 6. Complete the requested experience

- Map the screen to the adopted page pattern and compose it from established components and tokens. Reuse the page shell, header/action arrangement, content widths, grouping, and relevant interaction patterns. Keep layout rules consistent and preserve content priority across breakpoints.
- Implement navigation, form behavior, selection, dismissal, retry, and other requested interactions. Avoid placeholder links or buttons that merely look interactive.
- Connect to established data contracts when available. Label prototype behavior explicitly; never imply that simulated submissions, persistence, authentication, or payments are real integrations.
- Keep state ownership clear. Reuse existing data-fetching, routing, form, and error patterns; handle async races or repeated submissions when relevant.
- Use content lengths, empty collections, large values, and localized formatting that reflect the product. Avoid hardcoded currency/date conventions when the product is locale-aware.
- Respect server/client boundaries, keep secrets out of client code, and use safe rendering for untrusted content. Do not widen the task into unrelated backend changes.
- Preserve usability under zoom, keyboard input, reduced-motion preferences, and small screens. Maintain useful loading feedback and stable layout.

## 7. Verify the implementation

Read [Verification](references/verification.md) and select checks by the impact of the change. Use the project's actual commands and available browser tooling.

Treat these as four separate gates:

1. **Foundation compliance:** check applicable rule IDs against source bindings and rendered evidence, including spacing, hierarchy, overflow, motion, token roles, themes, and explained exceptions. Trace a representative page element to its shared component and tokens; check actual reuse and local bypasses.
2. **Behavior and accessibility:** exercise the user task, applicable loading/failure/recovery states, keyboard/focus behavior, labels, and contrast. Check continuity under slow completion or repeated actions when relevant. Use automated checks as one source of evidence, not a conformance certificate.
3. **Visual and responsive quality:** inspect actual rendering at narrow, representative wide, and relevant intermediate/change-boundary sizes, including different container contexts for shared components. Check required themes/states, long content, overflow, and transition stability; capture and inspect screenshots when available.
4. **Repository correctness:** run the relevant existing type, lint, build, token, and behavior checks. Add tests only for meaningful new behavior or a concrete regression risk. Do not add tests that merely restate a low-impact styling change.

Fix failures caused by the change. Distinguish unrelated pre-existing failures from new ones. If execution, browser access, or necessary data is unavailable, finish the accessible work and say exactly what remains unverified. Never describe a code-only review as browser-tested.

For new pages, reusable components, or shared-system changes, record a compact compliance result: pass, fail, not verified, or documented exception, with evidence for each relevant rule family. Do not count an unverified rule or an exception as a pass. Map enforceable rules to the project's actual types, lint rules, tests, and shared primitives; label manual review honestly. Follow the governance reference for proportionate enforcement and exceptions.

Expand checks only for a remaining risk, a shared dependency affected by the change, or a required project gate. Stop optional testing once the selected gates are satisfied.

## 8. Handoff

Report the delivered behavior, the design-system decisions reused or introduced, the relevant files/entry points, and the checks actually performed. Explain material limitations and any intentional exception to the system. Keep an isolated fix's handoff short.

Update the canonical foundation, pattern/example, and exception record when their contract changed. For a new system, identify where the foundation, tokens, and reusable components live and how the next feature must use them. Report the relevant compliance evidence and unresolved limits. Do not claim universal accessibility, production readiness, or performance improvements without the corresponding evidence.

## Reference map

| Resource | Read when |
| --- | --- |
| [Design contract template](assets/design-system-contract.md) | Establishing a system or documenting a substantial system change. |
| [Foundation governance](references/foundation-governance.md) | Persisting and enforcing project rules, extending patterns, handling exceptions, and performing design critique. |
| [Composition and reuse](references/composition-and-reuse.md) | Building a page/component from shared layers, finding reusable parts, assigning ownership, and evolving APIs. |
| [Visual foundations](references/visual-foundations.md) | Applying spacing, responsive layouts, typography, hierarchy, visual identity, or content/truncation rules. |
| [Interaction and motion](references/interaction-and-motion.md) | Applying shared UX, accessibility, feedback, recovery, and animation behavior. |
| [Tokens and themes](references/tokens-and-themes.md) | Defining tokens, mapping themes, or reviewing token adoption. |
| [Components and states](references/components-and-states.md) | Implementing reusable UI contracts, loading/refresh/mutation/pagination, recovery, or interaction. |
| [Framework integration](references/framework-integration.md) | Connecting tokens or state to the project's framework/styling stack. |
| [Verification](references/verification.md) | Selecting and executing checks appropriate to the change. |
