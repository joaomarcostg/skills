# Tokens and themes

Use this guide when defining, changing, or applying shared design decisions. For an isolated fix, inspect and reuse the relevant existing tokens; do not create a new system.

## Contents

- [Choose the source](#choose-the-source)
- [Define the contract](#define-the-contract)
- [Encode tokens](#encode-tokens)
- [Implement themes](#implement-themes)
- [Connect consumers](#connect-consumers)
- [Control exceptions](#control-exceptions)
- [Verify the result](#verify-the-result)

## Choose the source

1. Inspect token files, global styles, theme configuration, component packages, design references, and generation scripts before editing.
2. Preserve the established source and naming unless the task calls for migration. Follow published component-library contracts instead of duplicating their internals.
3. Select one editable source of truth for each shared decision. Prefer the existing approach; for new work, use the smallest approach that serves the product.

| Situation | Suitable source |
| --- | --- |
| One web application with no interchange requirement | CSS custom properties, or the existing library's theme configuration |
| Existing token build pipeline | Its current token source and compiler |
| Design-tool exchange or multiple platform outputs | Version-compatible structured tokens, such as DTCG JSON, with a tested compiler |

Record the source path, outputs, generation command, theme scope, and any naming mapping in existing project documentation. Mark generated files clearly and edit their source. Do not independently hand-maintain identical values in CSS, JSON, Tailwind, and design files.

Treat a design file as evidence of intended appearance unless the project explicitly makes it authoritative. Record unresolved design/code differences rather than silently claiming synchronization.

## Define the contract

Separate values from their use. Choose semantic tokens by purpose, not because their current values happen to match; a value match can fail in another theme ([Atlassian token guidance](https://atlassian.design/foundations/design-tokens)).

| Layer | Responsibility | Illustrative names |
| --- | --- | --- |
| Primitive | Reusable foundational values | `palette.blue.600`, `space.4` |
| Semantic | Meaning in the interface | `color.text.secondary`, `color.action.primary.background` |
| Component, optional | Independently adjustable component contract | `button.primary.background.hover` |

Use semantic colors in components. Add component tokens only when variants or ownership justify them; avoid wrapping every declaration in another alias. Use scale tokens directly for spacing and similar foundations when consistent with the project's conventions. This layering is an architectural choice, not a DTCG requirement.

Define only foundations the current scope needs, while checking these categories for omissions:

| Foundation | Decisions to make |
| --- | --- |
| Color | Canvas, surfaces, text, borders, actions, feedback, focus; chart roles when needed |
| Typography | Families and fallbacks, roles, size, weight, line height, tracking, readable measure |
| Space and sizing | Spacing scale, content widths, control sizes, density, touch areas |
| Layout | Gutters, columns, responsive behavior, breakpoints based on content |
| Shape and depth | Radius, border width, elevation, overlays, layer ordering |
| Motion | Duration, easing, permitted properties, reduced-motion behavior |

Name roles consistently with existing conventions. Document intended use, allowed variants, and exceptional values. Specify foreground/background pairs, including text on actions and feedback surfaces; checking a palette alone does not establish usable contrast.

Use the project's actual content and supported locales when selecting typography and density. Do not impose a universal font, spacing grid, radius, palette, or dark theme.

## Encode tokens

When exchanging structured tokens, check the consumer's supported specification and compiler version first. DTCG lists 2025.10 as stable; it is a Community Group specification, not a W3C Recommendation ([reports](https://www.designtokens.org/technical-reports/)). Recheck compatibility when adopting or updating tooling.

For that format, use `$value`, an explicit or inherited `$type`, and useful `$description` fields. Use its typed value shapes, including structured colors and dimensions; legacy hex-string color values are not interchangeable with the 2025.10 color shape ([format](https://www.designtokens.org/TR/2025.10/format/)).

Illustrative structure only; this is not a default palette or a requirement to adopt JSON:

```json
{
  "palette": {
    "ink": {
      "$type": "color",
      "$value": { "colorSpace": "srgb", "components": [0.1, 0.1, 0.1] }
    }
  },
  "text": {
    "default": { "$type": "color", "$value": "{palette.ink}" }
  }
}
```

Preserve useful aliases in the editable source. Validate missing references, cycles, types, names, and supported constructs with the project's compiler or validator. Do not present a custom subset check as full DTCG conformance. Do not invent a schema URL or assume every tool supports the complete specification.

For multiple token sets, compose selected sets and overrides before resolving aliases. Otherwise aliases can retain values from the wrong context. The DTCG resolver specifies this order; use its versioned specification only when implementing that resolver ([resolver](https://www.designtokens.org/TR/2025.10/resolver/)).

## Implement themes

Keep semantic role names stable across supported themes. Change values and role relationships deliberately; do not mechanically invert colors. Check surfaces, overlays, borders, text, feedback, focus, and interaction states together.

Define how the theme is chosen: explicit preference, stored preference, system preference, and product default, in the order the product requires. Keep initial server output and client initialization compatible. Test an initial load as well as switching after hydration.

Choose the required scope: document theme, independently themed subtree, or both. CSS aliases resolve at computed-value time before inheritance, so overriding a primitive on a child does not recompute an inherited alias defined on its ancestor ([CSS custom properties](https://www.w3.org/TR/css-variables-1/)).

For scoped themes, override semantic roles directly or redeclare the affected aliases at the same boundary. This small example deliberately redeclares aliases and supports nested light/dark boundaries:

```css
:root,
[data-theme="light"] {
  --palette-paper: #fff;
  --palette-ink: #161616;
}
[data-theme="dark"] {
  --palette-paper: #161616;
  --palette-ink: #fff;
}
:root,
[data-theme] {
  --surface: var(--palette-paper);
  --text: var(--palette-ink);
}
.panel {
  background: var(--surface);
  color: var(--text);
}
```

Adapt these illustrative names and colors to the actual system. If component aliases are needed, define them on the component or redeclare them at relevant boundaries so they resolve against the intended semantic values.

Check where dialogs, menus, tooltips, and other portaled content mount. A portal outside a themed subtree needs the correct theme scope or a supported portal container. Check isolated previews and embedded content when they are part of the requested product.

Coordinate browser-managed controls with `color-scheme` where appropriate. Preserve usable focus and boundaries in forced-colors mode; avoid relying entirely on shadows or background colors. Scope motion overrides to the transitions that need them and honor reduced-motion preferences.

## Connect consumers

Keep framework adapters thin. Import shared styles at the established application boundary and consume semantic variables, utility names, or the component library's token API. Do not duplicate tokens inside individual React or Svelte components.

Inspect installed versions before changing configuration. For Tailwind v4, use `@theme inline` when mapping utilities to other CSS variables so generated utilities reference the intended application variable at use time ([Tailwind theme variables](https://tailwindcss.com/docs/theme#referencing-other-variables)). Use the project's v3 configuration approach for v3; do not mix versions.

Do not use `var(--breakpoint)` in ordinary media-query size conditions. CSS custom properties substitute property values, not those conditions ([MDN custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties)). Use the existing build-time mechanism, framework breakpoint configuration, or documented shared constants. Keep generated media queries connected to their canonical source.

Prefer component variants over page-specific overrides of component internals. Apply state tokens through the component's supported state mechanism, keeping hover, focus, active, selected, disabled, invalid, and loading behavior distinct where relevant.

For canvas, charts, or JavaScript APIs that require resolved values, use the existing adapter or resolve CSS values in a browser-safe lifecycle. Ensure theme changes refresh those consumers; avoid copying a separate literal palette into JavaScript.

## Control exceptions

Search changed code for newly introduced palette literals, arbitrary spacing, duplicate styles, and raw component dimensions. Interpret each finding; a search is a review aid, not proof of a defect.

- Use tokens for repeated or system-level design decisions.
- Allow structural values such as `0`, `auto`, `100%`, `inherit`, `transparent`, and `currentColor` when their meaning is local and appropriate.
- Allow content-driven dimensions, dynamic data, illustrations, and intentional one-off geometry when a token would add no shared contract.
- Keep a necessary unmatched value local and document the reason; do not force an unrelated semantic token because it looks similar.
- Promote repeated meaningful exceptions into the system when warranted; avoid creating a token for every unique number.
- Do not hide missing tokens behind copied literal fallbacks. Use fallbacks only for an explicit integration or migration need and record their removal condition.

## Verify the result

1. Run the existing token build or validation when affected. Check all supported theme compositions, alias references, and required semantic roles.
2. Confirm generation is reproducible and produces no unexplained drift. Inspect the resulting diff before accepting generated changes.
3. Inspect representative rendered consumers in required themes and states, at relevant widths. Include actual foreground/background combinations and overlays.
4. Where scope warrants, change or inspect a representative token to confirm propagation to intended consumers, then restore any temporary experiment. Check unrelated roles remain independent.
5. For scoped themes, verify nested boundaries and portals; for JavaScript-rendered visuals, verify switching themes updates their output.
6. Review new literal values and overrides against the exceptions above. Reuse existing token linting or type checks rather than installing broad tooling for a small fix.
7. Report which themes, states, and consumers were verified, any intentional exceptions, and any remaining uncertainty. A valid token file alone does not prove a correct interface.
