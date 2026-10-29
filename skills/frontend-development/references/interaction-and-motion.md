# Interaction and motion

Apply these rules to the affected interface after reading the project's adopted foundation. Map these stable IDs to existing components, patterns, and tokens. Keep documented project conventions unless the current task deliberately changes them or they conflict with an accessibility requirement; resolve conflicts explicitly through the foundation's change process.

Treat the workflow rules below as product standards to adopt and implement. Distinguish cited accessibility requirements from recommended conventions and illustrative defaults. Do not present one company's patterns as a universal industry style.

## Contents

- [Interaction contracts](#interaction-contracts)
- [Feedback and content](#feedback-and-content)
- [Accessibility from the design stage](#accessibility-from-the-design-stage)
- [Motion contracts](#motion-contracts)
- [Practical motion patterns](#practical-motion-patterns)
- [Review and evidence](#review-and-evidence)

## Interaction contracts

**UX-01: Reuse the established pattern.** Identify the existing page, form, search, filter, navigation, dialog, selection, or notification pattern before creating another.
Preserve its placement, terminology, action order, dismissal behavior, and state ownership. Extend the canonical implementation when a new use case warrants a shared change.

**UX-02: Specify the complete task.** Record entry, primary action, expected outcome, applicable alternate states, and recovery.
For a multi-step flow, define forward/back behavior and what persists between steps. For filterable or paginated views, preserve the project's URL/history and selection conventions where those are part of the user task. Do not reset useful context accidentally on navigation.

**UX-03: Keep action meaning coherent.** Use navigation links for destinations and buttons for actions.
Choose specific labels that explain the action or result, and reuse the same term for the same concept across screens. Make confirmation actions answer the dialog's message. For example, pair an appointment-deletion question with "Delete appointment" and "Cancel". See [Fluent dialog guidance](https://fluent2.microsoft.design/components/web/react/core/dialog/usage).

**UX-04: Separate interaction state from request state.** Define only applicable states, including their combinations and precedence.
Do not use one generic `active` appearance for hover, focus, selection, expansion, and pending work.

| State distinction | Required behavior |
| --- | --- |
| Hover / keyboard focus | Keep keyboard indication independently visible; do not move the activation target on hover. |
| Pressed / selected / expanded | Match the actual meaning and expose the corresponding programmatic state. |
| Disabled / read-only | Define activation, focusability, editing, and explanation separately. |
| Idle / pending / failed / succeeded | Define valid transitions, feedback, retained data, and repeat-action behavior. |
| Empty / no matches / unavailable | Explain the actual situation and provide the relevant next action. |

Preserve the distinction between keyboard focus and selection described by the [APG keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/). For an `aria-pressed` toggle button, normally keep the label stable while changing the pressed state; a changing action label can use a different contract. See the [APG button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

**UX-05: Make unavailability understandable.** Disable an action only for a meaningful reason.
Explain a prerequisite where users need it, through accessible nearby content or an established help pattern. Do not rely on a hover-only tooltip attached to a disabled control. If using `aria-disabled` to preserve discoverability, explicitly block activation; the attribute alone is not an event guard. Do not disable the entire page because one region is busy.

**UX-06: Choose validation timing deliberately.** Apply the product's field-validation policy consistently.
Avoid reporting an expected incomplete editing state as an error, such as an email before its domain has been entered. Use blur/submission or another appropriate boundary; immediate feedback can suit requirements or availability checks. Keep helper text available during editing. See [Fluent text-field guidance](https://fluent2.microsoft.design/components/ios/core/textfield/usage).

**UX-07: Design recovery before the happy path is finished.** Preserve user input, distinguish field errors from service failures, and provide correction or retry where appropriate.
Define retry safety when the previous operation's outcome is uncertain; do not blindly repeat an action that may already have succeeded. Handle stale responses and repeated submissions so an earlier request cannot overwrite a newer user choice.

**UX-08: Match protection to consequences.** Use the established confirmation or undo pattern for destructive or consequential actions.
State the actual object and consequences. Preserve a clear escape path and avoid adding confirmation to routine reversible actions merely for consistency. Do not promise undo or successful cancellation unless the application actually supports it.

## Feedback and content

**UX-09: Place feedback at the relevant scope.** Use field feedback for field problems, inline feedback for local tasks, and page-level feedback for page-level problems.
Reserve modal interruption for cases that need a decision or acknowledgement before proceeding. Keep critical recovery information available; do not make a disappearing toast its only location. See [Carbon notifications](https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications) and [Fluent toast guidance](https://fluent2.microsoft.design/components/web/react/core/toast/usage).

**UX-10: Make progress truthful.** Acknowledge an action promptly, show its pending state, and prevent accidental duplicates where necessary.
Use determinate progress only when a meaningful amount or fraction is known; otherwise use an indeterminate indicator. Offer cancel/pause only when supported, and explain loss of progress where relevant. Do not invent percentages, add artificial processing time, or show success before the operation succeeds. See [Apple progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators).

**UX-11: Write for the user's next decision.** Record the product's terminology, capitalization, tone, action labels, and message patterns once.
Explain what happened and what can be done next; omit internal codes or technical details unless they help the intended user. Distinguish an empty first-use state from no search matches, unavailable permission, and a loading failure. Keep essential instructions and error recovery visible rather than truncated.

**UX-12: Keep feedback usable under repetition.** Avoid duplicate toasts and repeated live announcements for the same event.
Keep pending labels, state changes, and success confirmation consistent across equivalent components. Preserve layout around changing labels where practical, and keep relevant input and actions available after a failure. Show the resulting state so a brief success message is not the only evidence of completion.

## Accessibility from the design stage

Use the numeric criteria and verification scope selected by the main workflow. Design semantics, interaction, and content access alongside visual appearance.

**A11Y-01: Choose semantics before styling.** Prefer native elements and established accessible primitives.
Define accessible names, visible labels, reading order, grouping, and state relationships in the component contract. Do not use placeholder text as the only label. Do not add a role without implementing its keyboard behavior; ARIA does not supply that behavior. See [APG keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).

**A11Y-02: Preserve meaningful focus.** Define focus on entry, navigation, submission, removal, and dismissal.
Keep it visible in each supported theme and avoid clipping or obscuring it with sticky UI. If pending work disables the focused input, handle focus before it becomes unavailable. Avoid stealing focus for routine background feedback.

For modal dialogs, use the established pattern for initial focus, contained Tab navigation, Escape dismissal, inert background content, and appropriate focus return. Do not apply modal focus trapping to non-modal popovers. See the [APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

**A11Y-03: Expose states and errors through more than color.** Provide text or another understandable cue together with appropriate programmatic state.
Identify automatically detected input errors in text and supply known correction suggestions unless that would undermine security or the content's purpose. These obligations come from [WCAG 3.3.1, Level A](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) and [3.3.3, Level AA](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html).

**A11Y-04: Announce meaningful asynchronous status.** Make applicable status messages programmatically determinable so assistive technology can announce them without receiving focus.
Use routine polite updates and urgent interruption deliberately; do not announce every keystroke or visual change. Check that busy-region handling does not defer a progress message that needs to be announced immediately. See [WCAG 4.1.3, Level AA](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

**A11Y-05: Preserve access across input and display conditions.** Design keyboard and touch equivalents for hover interaction.
Keep content and controls usable under zoom, text expansion, narrow layouts, supported themes, and reduced motion. Treat a screenshot or automated scan as limited evidence; identify what was actually checked. Do not hide essential information to satisfy a visual layout.

**A11Y-06: Include accessibility in the acceptance criteria.** Identify the relevant keyboard path, focus outcome, accessible name/state, contrast pair, and content-access behavior before implementation.
Reuse the project's accessibility checks and conduct the relevant manual checks. A component's previous audit does not establish that its new composition or variant is accessible.

## Motion contracts

**MOTION-01: Require a purpose.** Use animation to communicate feedback, continuity, spatial relationships, hierarchy, or a meaningful state change.
Record "no animation" when movement adds no value. Avoid repeatedly replaying decorative introductions as users navigate routine tasks. Apple's [motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion) calls for purposeful motion and brief, precise feedback that does not overshadow the task.

**MOTION-02: Define motion as a reusable contract.** Record the following for each animated pattern before using it across pages:

| Contract field | Decision |
| --- | --- |
| Purpose and trigger | What the motion explains and what starts it. |
| Elements and properties | What changes; identify layout, opacity, transform, or other relevant properties explicitly. |
| Duration and easing | Which adopted tokens apply, including entrance/exit differences. |
| Sequencing | Which changes happen together or in order, and why. |
| Interaction and focus | What remains operable and how focus behaves during the transition. |
| Interruption | What happens when users reverse, dismiss, navigate, or activate again. |
| Reduced motion | The static or simplified equivalent, preserving the same information. |
| Completion and cancellation | How the component reaches a correct state even if motion is skipped or canceled. |

**MOTION-03: Adopt tokens once per product.** Reuse the established duration/easing roles.
For a new system, select a small set based on the size, purpose, and frequency of the transition; validate it in the representative screen. Keep component consumers connected to those tokens. Carbon demonstrates named motion roles and different timing for different distances and types of movement; its exact values belong to its system. See [Carbon motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview).

Optional starting ranges below are illustrative proposals, not accessibility requirements or universal design rules. Select exact tokens once, or retain the existing system instead; do not choose a fresh value from a range on each page.

| Illustrative role | Starting range to evaluate | Typical use |
| --- | --- | --- |
| Feedback | 80–150 ms | Small color/opacity feedback. |
| Local transition | 150–250 ms | A compact disclosure or overlay entrance. |
| Large transition | 250–400 ms | A larger contextual surface change when continuity helps. |
| Instant | 0 ms | Immediate state change or reduced-motion alternative. |

Choose matching feedback, entrance, and exit easing roles explicitly. Do not apply one arbitrary curve to every interaction or adopt another brand's expressive motion automatically.

**MOTION-04: Keep transitions interruptible.** Let the newest user intent win.
Reverse or cancel an animation where appropriate; clear obsolete callbacks and avoid queuing repeated decorative transitions. Do not require users to wait for motion before they can dismiss, navigate, or act again unless the underlying operation itself requires it. Apple explicitly recommends allowing motion to be canceled in its [motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion).

**MOTION-05: Keep functionality independent of animation.** Do not make submission completion, cleanup, focus restoration, or essential state updates depend solely on an animation/transition event that may never fire.
Handle skipped, canceled, interrupted, and zero-duration cases. During exit transitions, keep hidden or removed content from leaving stray focus targets or intercepting unrelated input.

**MOTION-06: Define reduced motion deliberately.** Honor the user's reduced-motion preference as an adopted project rule.
Remove or simplify nonessential displacement, scaling, parallax, and repeated shimmer while preserving status and causality. An instant change, static state, or restrained opacity change may suit the pattern; choose and verify the actual alternative. Nonessential interaction animation that can be disabled is specifically [WCAG 2.3.3, Level AAA](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), not a universal AA criterion.

**MOTION-07: Check automatic movement separately.** Evaluate auto-moving and auto-updating content against [WCAG 2.2.2, Level A](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html). Automatic moving/blinking/scrolling content lasting over five seconds alongside other content generally needs a pause/stop/hide mechanism unless essential; auto-updating content has a separate requirement without that five-second threshold. Reduced-motion support alone does not establish compliance.

**MOTION-08: Keep motion compatible with the task and device.** Avoid `transition: all`; specify the intended properties.
Prefer efficient animation techniques where they preserve the design, and inspect actual performance when a transition creates layout work or moves many elements. Keep the activation target stable and avoid motion-induced layout jumps. Do not add animation libraries or performance abstractions without a task need.

## Practical motion patterns

Use these examples to specify behavior, not to mandate animation where none is needed.

| Pattern | Contract to adopt |
| --- | --- |
| Button feedback | Change approved state properties with the feedback token; retain a distinct keyboard focus indicator and a stable hit area. |
| Expandable section | Preserve a clear relationship to its trigger; update expanded semantics, handle reversals, and reveal immediately under the chosen reduced-motion policy. |
| Dialog or drawer | Use adopted entrance/exit roles; coordinate focus and background interaction with open/closed state rather than a decorative delay. Reopening during exit must produce a valid open state. |
| Pending action | Show truthful pending text and prevent harmful duplicates; keep cancellation/recovery usable. Stop the indicator when work finishes or fails. |
| Skeleton | Use only where the pending content's structure is meaningfully known. Preserve useful layout, make placeholders noninteractive, and use a static alternative when shimmer is reduced. |
| Progress indicator | Expose an actual known amount as determinate progress; use an indeterminate state otherwise. Keep a textual status available when motion is simplified. |
| Toast or status message | Communicate the outcome independently of entrance/exit animation. Preserve critical recovery elsewhere and avoid repeated animated interruptions. |
| Reordered list | Preserve identity, focus, and selection. Use continuity motion only if it clarifies the change; reduced motion must produce the same correct order. |

Do not add a minimum spinner duration just to display an animation. If a product uses a short indicator delay to prevent flashes, record it as a feedback policy and keep immediate acknowledgement and actual completion truthful.

## Review and evidence

For a new page or component, inspect its applicable UX, A11Y, and MOTION rules against the adopted foundation and canonical patterns. Record the specific rule, implementation, and evidence for deviations or unresolved questions.

- Exercise the user task with normal, invalid, pending, failed, empty, and successful data where applicable.
- Check repeated activation, cancellation, reversal, navigation during pending work, and stale responses when those paths exist.
- Compare equivalent actions and messages across representative pages; inspect terminology, placement, state treatment, and recovery consistency.
- Inspect relevant keyboard and touch interactions, focus destinations, and status announcements; do not infer assistive-technology behavior from visual appearance.
- Check normal and reduced motion, including zero-duration and interrupted transitions. Verify final state and operability as well as appearance.
- Use existing behavior and visual coverage where it resolves real risks. Keep tests focused; do not add broad tooling or exhaustive permutations for an isolated change.
- Report static inspection, logic tests, browser interaction, visual review, and assistive-technology checks accurately as different evidence types.

Apply the main workflow's verification gate before declaring completion. Fix shared causes in the canonical component or pattern, then inspect affected consumers; do not introduce page-specific exceptions merely to make one screen pass.
