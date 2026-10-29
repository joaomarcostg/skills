# Components and states

Read when creating or changing reusable UI, interactive behavior, or page composition. Extend the project's established components before creating another implementation.

Load the project's foundation and applicable rule IDs first. Bind the component to its adopted spacing, typography, visual style, content-overflow, interaction, accessibility, and motion contracts. Extend a missing contract at its source or record a bounded exception instead of adding a page-specific default.

## Contents

- [Component contract](#component-contract)
- [Semantics and keyboard behavior](#semantics-and-keyboard-behavior)
- [State modeling](#state-modeling)
- [Forms and asynchronous feedback](#forms-and-asynchronous-feedback)
- [Loading and async operations](#loading-and-async-operations)
- [Dialogs and overlays](#dialogs-and-overlays)
- [Composition and variants](#composition-and-variants)
- [Responsive content, language, and data](#responsive-content-language-and-data)

## Component contract

Record the following in existing component documentation, stories, types, or a short implementation note. Do not create a separate document for a trivial change.

| Field | Decision to make |
| --- | --- |
| Purpose | User task, intended contexts, and cases needing a different component. |
| Semantics | Native element, accessible name, relationships, and any required ARIA pattern. |
| Public API | Content slots, events, controlled/uncontrolled ownership, defaults, and forwarded native attributes. |
| Variants | Finite appearance, size, intent, and density options justified by actual uses. |
| States | Supported state transitions, priorities, and user feedback. |
| Ownership | Which layer owns data/request lifecycle, selection, editing, and local disclosure state; which values/events are passed across the API. |
| Tokens | Semantic roles and component aliases consumed by each part and state. |
| Layout | Intrinsic size, wrapping, overflow, parent constraints, and responsive changes. |
| Async behavior | Initial load, refresh, mutation, and incremental loading where applicable; retained content, duplicate actions, status announcements, focus, and recovery. |
| Content and motion | Which content can truncate and how it is revealed; animation purpose, shared timing, interruption, and reduced-motion behavior. |
| Verification | Representative usage, meaningful behavior checks, and affected consumers. |

Put reusable behavior in the owning component or pattern. For example, a button can expose a pending appearance and activation contract, while its feature owns the save request and result. A field composition can own label, hint, error association, and internal spacing while receiving the validation result. Pages must not reimplement those details independently. Check the composed result as well as the isolated primitive; inherited quality can be broken by an invalid combination.

## Semantics and keyboard behavior

- Use native buttons for actions and links with destinations for navigation. Set button `type` intentionally inside forms. Preserve headings, landmarks, lists, and reading order.
- Give icon-only controls an accessible name. Hide decorative icons from assistive technology; meaningful images need an appropriate text alternative.
- Preserve visible labels in accessible names. A placeholder is not a replacement for a persistent field label.
- Prefer native controls or an established accessible primitive. Adding an ARIA role does not supply keyboard behavior; implement the relevant interaction pattern when a custom widget is necessary. See [APG principles](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/).
- Keep DOM and focus order meaningful. Avoid positive `tabindex`; use the relevant APG pattern for arrow-key navigation inside composite widgets. Do not make every item in a composite independently tabbable by default. See [APG keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).
- Preserve a visible focus indicator and ensure sticky UI, clipping, and overlays do not obscure it. Test this in the rendered page, not only in an isolated component.
- Native `disabled` and `aria-disabled` have different behavior. If using `aria-disabled`, explicitly prevent activation while preserving the intended focus behavior. Do not treat the attribute as an event guard.

## State modeling

Use the existing state-management approach. Prefer finite, named states where independent booleans permit contradictory combinations. Distinguish interaction state from the status of a data request.

| State | Required consideration |
| --- | --- |
| Default | Clear affordance and understandable content. |
| Hover / focus / pressed | Appropriate feedback without layout movement; keyboard feedback independent of hover. |
| Selected / expanded | Persistent visual and programmatic state, distinct from focus. |
| Disabled / read-only | Correct semantics and discoverable reason when useful; distinct interaction behavior. |
| Pending | Progress feedback, deliberate duplicate-submission handling, and preserved user input. |
| Empty | Distinguish no data, no search matches, and unavailable permission when relevant; provide a useful next action. |
| Error | Explain recovery, associate field errors, preserve entered values, and support retry where appropriate. |
| Success | Confirm the resulting state; do not rely only on a disappearing toast. |

Implement only relevant states. Define precedence for combinations such as focused-invalid and selected-disabled. Use semantic state tokens rather than per-page color patches. Never communicate state by color alone.

Represent independent concerns separately where necessary: valid content may coexist with a background refresh or a refresh failure. Do not collapse these cases into one `isLoading` flag that repeatedly removes useful content. Keep the actual data library's lifecycle authoritative rather than maintaining a competing set of flags.

## Forms and asynchronous feedback

- Associate labels, instructions, and error text with fields. Group related choices with appropriate semantics, such as `fieldset` and `legend`.
- Use suitable input types, autocomplete hints, and mobile input modes. Keep input parsing separate from display formatting; allow editing states such as a temporarily incomplete decimal.
- Preserve values after failed submission. Show errors at the relevant fields, with a summary or deliberate focus movement when a long form needs it.
- Announce meaningful asynchronous status changes without interrupting every keystroke. Use polite status announcements for routine progress; reserve assertive alerts for situations that warrant interruption.
- Prevent accidental repeated actions where necessary, but keep recovery and navigation usable. A spinner is not sufficient evidence that a submission completed.
- Use project validation and submission mechanisms. Client validation improves feedback; it does not replace server validation.

See [WAI forms guidance](https://www.w3.org/WAI/tutorials/forms/) for labels, grouping, validation, and notifications.

## Loading and async operations

Choose feedback for the operation and affected scope. Keep the shell and unrelated tasks usable where possible; Apple recommends revealing available content promptly and allowing other work during loading. See [Apple loading](https://developer.apple.com/design/human-interface-guidelines/loading). Use the existing router/data layer and shared feedback components instead of adding a separate loading system for each page.

| Situation | Reusable behavior |
| --- | --- |
| Initial load without usable data | Retain available navigation/context. Show a suitable local placeholder or status; use a skeleton only when the expected structure is known. Do not briefly display an empty-state message before the request resolves. |
| Refresh with valid existing data | Keep usable content, selection, and reading position; show refresh feedback at the affected scope when useful. A refresh failure can leave that content visible with an appropriate stale/error indication and retry. |
| New query, resource, or account | Associate results with the actual request identity. Do not present previous results as current; retain them only when the product explicitly permits and distinguishes that state. Clear content when access or identity makes retention invalid. |
| Save or other mutation | Acknowledge the action locally, preserve inputs, and prevent harmful duplicates. Define whether editing continues and how later edits coexist with the submitted snapshot. Keep unrelated actions usable and show the confirmed outcome. |
| Pagination or load more | Preserve earlier results and provide progress/retry beside the loading boundary. Keep the user's place, distinguish completion from failure, and do not move focus merely because more items arrived. |

### Indicators, layout, and motion

- Use the shared indicator, pending-button, skeleton, and empty/error patterns where they exist. Keep their labels, placement, density, and tokens coherent across features.
- Acknowledge activation immediately and show completed content as soon as it is ready. If the adopted policy briefly delays a spinner to avoid flashes, keep acknowledgement and duplicate-action protection immediate. Never delay completion merely to display an animation.
- Reserve appropriate space using known content structure, image dimensions/aspect ratio, and stable control geometry. Do not fix a text container's height so tightly that real messages or translations clip. Keep pending and ready hit areas stable.
- Make skeleton shapes decorative and noninteractive, normally hidden from the accessibility tree, with one meaningful status for the loading region. Do not expose fake placeholder links, fields, or repeated announcements. Use a static skeleton under the adopted reduced-motion policy.
- Use determinate progress only for a known, meaningful amount of work; otherwise use an indeterminate indicator. Never invent percentages or promise timing that the system cannot establish. See [Apple progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators).
- Prefer the existing accessible progress component or native `<progress>` with an accessible label. For native indeterminate progress omit `value`; text inside `<progress>` alone is not its accessible label. For a custom indeterminate progressbar omit `aria-valuenow`. See [MDN progress](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress) and [progressbar semantics](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/progressbar_role).
- Apply the adopted motion contract, including interruption, reduced motion, and completion independent of animation events. Avoid replaying entrance motion or shimmer every time valid data refreshes.

### Announcements and focus

Expose meaningful progress and outcomes using the established status-message pattern; avoid announcing every polling update or every percentage change. Keep a suitable announcer available before updating its message, and verify the actual assistive-technology behavior when possible. A progressbar's changing value does not by itself guarantee timely live announcements. See [WCAG status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) and [MDN live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions).

Scope `aria-busy` to content being updated and clear it when that update settles. Busy state can defer announcements from its subtree: keep a progress message that must be announced during the operation outside that busy subtree. `aria-busy` neither disables controls nor supplies a complete loading announcement. See [MDN aria-busy](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-busy).

Do not steal focus for routine refreshes or success messages. If pending behavior removes or disables the focused control, choose a deliberate usable destination before doing so. Retain input, focus, and context after recoverable failures where appropriate; use the existing error-summary policy for forms that need it.

### Completion, races, and recovery

- Let the feature or data layer own request identity, cancellation, and result validity; pass explicit state/events to reusable UI. Ignore obsolete results so a slow earlier request cannot overwrite a later query, selection, or resource.
- Use the established duplicate-action guard and retry policy. For a mutation whose outcome is uncertain, check status or use the integration's actual safe-retry mechanism before repeating it. Do not invent idempotency guarantees.
- Offer cancel or pause only when supported. Aborting a client request does not prove a server operation stopped; do not display a false canceled or undone outcome. Distinguish intentional cancellation from failure where the product needs it.
- Clean up obsolete callbacks and indicators on completion, failure, cancellation, and navigation. Keep visible data and feedback associated with the operation that produced them.
- Use optimistic UI only when the operation and product contract support it; define reconciliation and failure recovery. Do not present an irreversible action as confirmed before the integration confirms it.

Exercise the applicable first-load, refresh, delayed, empty, failed, retried, and repeated-action paths. Verify the affected component in a narrow container and the assembled page, including reduced motion and retained-content behavior. Use controlled latency or failures in existing development tools when needed; never ship artificial delays as product behavior.

## Dialogs and overlays

- Reuse the project's accessible dialog implementation or suitable native behavior instead of building a new focus-management system.
- For a modal, move focus inside on opening, contain Tab/Shift+Tab, provide dismissal, make underlying content inert, and return focus appropriately on closing. Select initial focus for the actual content; it is not always the first input. See [APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).
- Give the dialog an accessible name. Avoid flattening long, structured dialog content into one oversized accessible description.
- Do not apply modal focus trapping to non-modal popovers. Match menus, tooltips, listboxes, and dialogs to their different interaction contracts.
- Check stacking, scroll handling, viewport edges, focus visibility, and theme inheritance. A portal can place content outside its original themed subtree.

## Composition and variants

- Let a component own its internal spacing and state styling; let its parent own placement and gaps between siblings. Use the project's conventions where they differ.
- Express stable product distinctions with named variants. Avoid overlapping booleans such as `primary`, `danger`, and `subtle` when an explicit variant avoids invalid combinations.
- Preserve supported native attributes, labels, event handling, refs, and form participation when wrapping primitives. Do not make wrappers that silently remove essential capabilities.
- Keep variants finite and discoverable. Avoid generic components with dozens of unrelated modes or abstractions based only on hypothetical reuse.
- Prefer composition for content and layout. Extract reusable patterns when actual repetition or behavior warrants it; do not turn every HTML element into a component.
- Route repeated styling decisions through the token contract. Retain documented structural literals where a token would add no design meaning.

## Responsive content, language, and data

- Adapt to available space and content, not only named devices. Choose wrapping, stacking, and navigation changes around actual layout pressure.
- Use intrinsic sizing and suitable min/max constraints. Check long labels, unbroken identifiers, empty content, large values, and translated text. Avoid fixed heights that clip content when text grows.
- Use logical properties where direction affects layout. Preserve readable order and keyboard order when the visual arrangement changes.
- Use the project's locale, currency, and time-zone contracts. Format display values with appropriate internationalization APIs; do not guess currency from locale or reinterpret date-only values as timestamps. See [MDN Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl).
- Use table semantics for tabular data, with associated headers and a useful caption when needed. Do not apply a grid role unless implementing its keyboard interaction model. See [WAI tables guidance](https://www.w3.org/WAI/tutorials/tables/).
- On narrow screens, preserve important columns and actions through deliberate scrolling, a detail view, or an equivalent layout. Do not hide critical data merely to remove horizontal overflow.
- For charts, use the system's data-visualization colors and state semantics; include understandable labels, units, and a suitable text summary or data alternative. Color alone must not carry a distinction.
- Respect reduced-motion preferences and keep feedback understandable without motion. Implement only supported themes, but verify relevant states in each one.
