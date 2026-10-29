# Verification

Read before reporting frontend work complete. Verify the affected user task and design decisions, using existing project tooling and the smallest checks that resolve concrete risks.

## Choose the scope

| Change | Proportionate evidence |
| --- | --- |
| Copy or isolated visual correction | Inspect the affected content, token usage, and relevant responsive rendering. Do not add new tests for a reversible, low-impact visual fix. |
| New component or interaction | Exercise relevant states and keyboard behavior in a browser; run applicable existing checks. Add behavior tests only when they address a meaningful regression risk. |
| Shared token, theme, or foundational component | Inspect dependencies and representative consumers in supported themes. Check a dense view, form, or overlay where affected; reuse existing regression coverage. |
| New screen or substantial flow | Exercise the main task plus relevant empty, pending, and error paths; inspect narrow and wide layouts with realistic content. |

Do not introduce Storybook, a test runner, a token build pipeline, or a whole-app refactor merely to perform verification. Do not require every permutation when representative coverage resolves the risk.

## Check adopted foundation rules

Read the current project foundation and identify the applicable rule IDs, scope, source bindings, and exceptions before checking the implementation. Include spacing ownership and relationships, text roles and semantic structure, hierarchy, visual identity, content overflow, UX patterns, accessibility, and motion where affected.

For a new page, reusable component, or shared-system change, record Pass, Fail, Not verified, or Exception with concrete evidence for each applicable family. Use existing review documentation or a compact final-response table. An inherited defect, unresolved check, or documented deviation is not a pass.

Inspect relationships in the assembled screen: compare field gaps, section gaps, page gutters, widths, and action placement with the adopted pattern. Check that essential messages remain readable, eligible truncated content has the documented full-content path, and near-identical long values remain distinguishable. Check motion interruption and the reduced-motion equivalent when movement is present.

Use the design critique in the foundation-governance reference to assess task clarity and interaction quality. Mechanical token compliance does not establish that the design serves the user. Do not label visual or usability judgment automated merely because a linter or screenshot test runs.

## Check design-system linkage

1. Identify the canonical token source and generated outputs. Confirm the intended source was changed and generated artifacts were rebuilt using the project's established command when needed.
2. Check new references, types, alias resolution, and cycles using existing validators when available. Do not describe a text search as a complete token validator.
3. Trace a representative affected element from its variant through its semantic token to the resolved browser value. Inspect inherited values and the cascade if the result differs.
4. Switch supported themes in the actual DOM scope. Check scoped aliases, component overrides, and portal-rendered UI. Verify computed colors, not merely whether a theme attribute changed.
5. Check repeated visual decisions for accidental local literals or primitive palette usage. Distinguish design decisions from legitimate structural values such as zero, `auto`, percentages, and geometry.
6. Verify spacing, typography, hierarchy, state treatment, and density against the design contract or supplied reference. Token compliance alone does not establish a good layout.
7. Trace a representative page element through its shared component/pattern to tokens. Confirm real source reuse; inspect duplicate implementations and page overrides that bypass a shared contract. Check relevant existing consumers after a shared change.

## Accessibility targets and distinctions

These are focused checks, not an exhaustive WCAG audit. Use WCAG 2.2 AA as the baseline unless project requirements specify more. A passed subset or automated scan does not establish full conformance.

| Area | Check |
| --- | --- |
| Text contrast | At least 4.5:1 for ordinary text; 3:1 for large text, meaning at least 18pt or 14pt bold. Respect specified incidental-content exceptions. Muted instructions are not automatically exempt. [SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |
| Control and graphic contrast | Information necessary to identify controls, states, and meaningful graphics generally needs 3:1 against adjacent colors; apply the criterion's exceptions. Decorative borders do not all need this ratio. [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) |
| Focus | Keyboard focus must be visible and the focused component must not be entirely hidden by author-created content. Check sticky headers, footers, clipping, and overlays. [SC 2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [SC 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) |
| Focus appearance | A 2 CSS px perimeter-equivalent area with 3:1 focused/unfocused pixel contrast belongs to AAA SC 2.4.13. It can be a project default; do not present it as the AA rule. [SC 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) |
| Pointer targets | AA requires 24 × 24 CSS px or an applicable spacing, equivalent-control, inline, user-agent, or essential exception. A 44 × 44 target is a useful product preference and an AAA target-size criterion, not a universal AA requirement. [SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [SC 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) |
| Reflow | Vertical-reading content generally reflows at 320 CSS px without loss or two-dimensional scrolling; inherently two-dimensional content has exceptions. Inspect page layout around scrollable tables or charts; do not hide critical data to manufacture a pass. [SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) |
| Text resizing | Except captions and images of text, text must support resizing to 200% without loss of content or functionality. [SC 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) |
| Text spacing | Where applicable, tolerate user overrides of line height 1.5, paragraph spacing 2em, letter spacing 0.12em, and word spacing 0.16em without loss. These are override checks, not mandatory default typography. [SC 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) |
| Motion | Honor reduced-motion preferences as a project default. Disabling nonessential interaction animation is AAA SC 2.3.3; automatic movement can implicate separate requirements. [SC 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) |

Check actual foreground/background combinations in relevant states and themes, including transparency and surfaces behind overlays. Do not round a failing contrast value up to the threshold.

## Exercise behavior in a browser

- Run the affected page or component using the project's documented development or preview workflow. If browser execution is unavailable, perform useful static checks and disclose the unverified rendering and interactions.
- Complete the primary user task with realistic inputs. Check relevant validation, pending, success, failure, retry, and navigation behavior.
- For changed async flows, check applicable initial load, valid-data refresh, mutation, and pagination separately. Exercise slow/error completion and repeated actions; inspect retained content/input, obsolete responses, recovery, focus, announcements, and loading-to-result stability. Use existing mocks or development fixtures; do not introduce failures into live systems.
- Traverse with Tab and Shift+Tab, activate controls with expected keys, and exercise composite-widget keys where applicable. Verify focus after opening, dismissing, submitting, and navigation.
- Inspect accessible names, field associations, state exposure, and status announcements. Use assistive-technology checks when available and relevant; do not claim to have performed them from DOM inspection alone.
- Inspect a narrow viewport, a representative wide viewport, intermediate widths, and boundaries changed by the implementation. Check shared components in different relevant containers, plus zoom/reflow, text expansion, touch access, and overflow. A wide page can contain a narrow panel.
- Check important text and data with long, empty, and large values. Inspect touch affordances, hover-independent access, and supported themes.
- Check relevant runtime/console errors and failed assets. Distinguish new failures from existing unrelated ones.

## Use automation carefully

- Discover scripts from the repository's manifest and instructions; use its package manager and installed tools. Do not invent `test:a11y`, `tokens:check`, or other commands that do not exist.
- Run appropriate existing lint, type, build, and targeted test commands. Broaden checks for a shared dependency change or required gate, not merely to accumulate green results.
- Prefer assertions about user-visible behavior and outcomes. Avoid tests that only duplicate component internals or freeze incidental CSS classes.
- If accessibility tooling exists, scan meaningful rendered states, including opened dialogs or menus. Hidden UI is not covered by an initial-state scan. Automated tools detect only some problems; manual checks remain necessary. See [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing).
- Match axe tags to the installed version. Where supported, WCAG 2.2 A/AA coverage combines earlier A/AA tags with `wcag22aa`; do not assume one tag includes every preceding level. Review inconclusive results. See [axe API documentation](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md).
- Never suppress rules, exclude changed UI, or weaken assertions just to make a result green. Explain legitimate existing exceptions with their scope.

## Inspect visual evidence

- Capture affected screens or states with stable data, viewport, fonts, and theme. Inspect screenshots against the intended design, not only against a previous image.
- When visual regression tests exist, preserve the baseline environment and review differences before accepting new baselines. Browser rendering varies with OS and environment. See [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots).
- Examine hierarchy, alignment, rhythm, line lengths, clipping, density, focus, and interaction states. A successful build or screenshot capture does not mean the visual result was inspected.
- Treat screenshots as evidence of a specific viewport and state. They do not demonstrate working interactions, responsive ranges, or accessibility by themselves.

## Close the work

Report the result, meaningful token/component decisions, checks actually performed, and material limitations. Keep evidence proportional to the task; existing docs or the final response usually suffice.

Separate verified behavior from assumptions and checks not run. Do not say “fully accessible,” “pixel-perfect,” or “all tests pass” without the corresponding scope and evidence.

Stop when the relevant gates pass and no concrete remaining risk requires more work. Do not add speculative refactors, repeated broad test runs, or extra tooling after the requested outcome is sufficiently verified.
