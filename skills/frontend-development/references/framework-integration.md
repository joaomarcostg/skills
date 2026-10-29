# Framework integration

Inspect the installed versions and existing conventions before using an adapter. Treat the examples below as mappings, not a request to install their frameworks. Consult the official documentation for the installed version when an API is uncertain or version-sensitive.

## Shared integration rules

- Import global tokens at the existing application entry point. Keep component styles consuming the same semantic roles, whether the project uses CSS Modules, scoped CSS, utility classes, or a library theme API.
- Preserve the existing reset, stylesheet order, cascade layers, and specificity strategy. Avoid new global selectors, broad `!important` rules, or a second reset that changes unrelated components.
- Keep the token source independent of per-screen JavaScript state. Use the established theme mechanism and verify first render, hydration, preference persistence if present, and portaled overlays.
- Adapt through a component library's supported theme/variant API. If the library exposes only a limited adapter, document that boundary instead of copying values into independent palettes.
- Preserve the lockfile and package manager. Add a dependency only when it solves a task requirement the current stack cannot reasonably handle.

## Plain CSS, CSS Modules, and scoped CSS

Consume semantic custom properties directly:

```css
.button {
  color: var(--color-action-primary-text);
  background: var(--color-action-primary-bg);
  padding-inline: var(--space-4);
  border-radius: var(--radius-control);
}
```

Keep theme-dependent aliases in the correct scope, including any nested themes the product supports. CSS Modules and scoped selectors do not automatically isolate inherited custom properties. Read the alias example in the tokens reference before changing theme boundaries.

## Tailwind

**Confirm the installed major version first.** Keep existing utility names if they already express semantic roles. Avoid constructing class names from fragments that the project's class detector cannot discover.

For Tailwind v4, map application variables with `@theme inline` when the theme values reference other CSS variables. This makes generated utilities use the referenced value at the point of use. See the official [theme-variable documentation](https://tailwindcss.com/docs/theme#referencing-other-variables).

```css
@theme inline {
  --color-action: var(--color-action-primary-bg);
  --color-on-action: var(--color-action-primary-text);
}
```

Consume with `bg-action text-on-action`. Define the application variables in the canonical token source and the appropriate theme scopes; this mapping does not create those values.

For Tailwind v3, use the existing configuration mechanism instead. A basic mapping for complete CSS color values is:

```js
// Merge into the project's existing configuration and module format.
theme: {
  extend: {
    colors: {
      action: 'var(--color-action-primary-bg)',
      'on-action': 'var(--color-action-primary-text)',
    },
  },
}
```

Do not assume opacity modifiers work with every custom-property representation. If needed, use and verify the version's supported channel/alpha mapping. See [Tailwind v3 custom colors](https://v3.tailwindcss.com/docs/customizing-colors#using-css-variables). Keep v4 directives out of v3 projects.

Use the system's spacing and type utilities consistently. An arbitrary value referencing a canonical token may be legitimate; an unexplained new palette value repeated across screens is design drift. Keep breakpoints in the established build-time configuration rather than trying `var()` inside ordinary media-query conditions.

## React and Next.js

- Keep visual variants separate from business state. Preserve native element props and established event semantics; type mutually exclusive states when that prevents invalid combinations.
- Derive values from existing props/state when practical. Use effects to synchronize with external systems, not just to mirror renderable derived data. See [React's effect guidance](https://react.dev/learn/you-might-not-need-an-effect).
- Inspect the router and framework version. In the Next.js App Router, preserve server rendering and place client boundaries around the interaction that needs them; do not move an entire page to the client merely to toggle a control. Browser APIs must be accessed in a browser-safe lifecycle, not during server prerendering. See [Next.js server and client components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
- Use the project's existing loader/query, form, navigation, and error-handling conventions. Keep server-only data and credentials out of client props and bundles.
- Preserve stable initial markup across server rendering and hydration, including theme and locale choices. Use the established framework strategy rather than hiding mismatches or disabling SSR to suppress warnings.
- Use existing image/font loading facilities when relevant. Avoid adding unnecessary client JavaScript or large packages for static decoration; investigate performance with actual evidence before adding memoization or virtualization.

## Svelte and SvelteKit

- Inspect the Svelte and SvelteKit versions and the surrounding code's reactivity style. Match the supported component/event syntax; do not perform an incidental runes, stores, or routing migration.
- Consume global semantic properties inside scoped component styles. Keep intentional global selectors limited to documented foundations or theme boundaries.
- Reuse the project's supported loading and form conventions. Keep request-specific user state out of module-level server singletons; isolate state per request/component tree where appropriate. See [SvelteKit state management](https://svelte.dev/docs/kit/state-management).
- Guard browser-only integrations using the installed framework's supported mechanism. Keep first-render markup and theme selection consistent across server rendering and hydration.
- Preserve component accessibility diagnostics and fix the underlying semantic issue. Do not silence a warning merely because the component looks correct.

## Existing libraries and other frameworks

Use the same contract with Vue, Angular, Web Components, or another framework: one canonical source, a thin supported adapter, semantic consumption, accessible interaction, and rendered verification. Consult primary documentation for the actual dependency and version. Do not replace working infrastructure simply because this reference has examples for a different stack.
