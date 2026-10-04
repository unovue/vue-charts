# ADR-0008: ChartDemo — cube-motion code card, CSS-variable syntax palette

- Status: Accepted
- Date: 2026-10-02

## Context

`ChartDemo` predated the ADR-0002 token rebuild: it used Nuxt UI `--ui-*`
vars, an 8px radius and a solid border, so every docs demo read as foreign
next to the cube-motion landing. Its dark mode was also silently broken —
the scoped selector `:global(.dark) .chart-demo-code :deep(...)` compiles to
a bare `.dark` (Vue's SFC scoped transform drops everything after
`:global(...)`), so the github-dark shiki overrides never matched and dark
mode rendered light-theme token colors.

A prototype run (`/proto/chart-demo`, since removed) compared five
directions: Current (baseline), Cube Native, Inset Stage (landing hero card
recipe, vertical), Dark Console (always-dark code panel), Editorial (no
card, hairlines only).

## Decision

**Cube Native** — a faithful translation of cube-motion.dev's `.code`
recipe to the ds tokens:

- One flat surface card: `bg-(--ds-surface)`, 24px squircle radius, inset
  1px ring + `--ds-shadow-card`.
- A code-bar header: accent file icon + filename (mono 12px muted),
  Preview/Code tabs (active = `--ds-block` pill), copy button (`.ds-copy`)
  right-aligned, shown only on the Code tab.
- Code pane: 13px JetBrains Mono / 1.7, CSS-counter line numbers (2ch,
  `--ds-dim`, not selectable), `max-height: 26rem`.
- Syntax colors come from two concrete shiki themes
  (`utils/shiki-code-themes.ts`) fed to shiki's dual-theme output
  (`themes: { light, dark }`, `defaultColor: 'light'`): every token span
  carries BOTH colors as inline `--shiki-light`/`--shiki-dark` vars, and an
  unscoped `.dark .chart-demo-code .shiki span { color: var(--shiki-dark)
  !important }` rule flips them. Palettes: cube hues in light
  (`#b0389c / #2a5bd7 / #1a7f37 / #0b6bcb / #b25a00`), derived lighter
  values in dark (`#d476c2 / #82a6f5 / #5fce85 / #5aa8f5 / #dd9757`).
  shiki v4 removed the bundled `css-variables` theme, hence the local ones.

  An earlier iteration used a single theme whose colors were
  `var(--shiki-token-*)` references resolved from component CSS — it was
  abandoned because Chrome does not re-run `var()` substitution in
  innerHTML-injected inline styles when an ancestor `.dark` class flip
  changes the custom property's value: freshly created elements resolved
  correctly while pre-flip spans kept computing the inherited foreground
  (all-white code in dark mode). The dual-theme mechanism flips via rule
  matching on the spans themselves, which always recalculates.
- The dark flip rule lives in an **unscoped** `<style>` block — scoped
  `:global(.dark) .x` compiles to a bare `.dark` (above) — and uses
  `!important` so style-tag order can't matter.

Verified via CDP after a live light→dark flip: keyword span computes
`#b0389c` in light, `#d476c2` in dark.

## Rejected (from the prototype run)

- **Inset Stage** — nested `--ds-block` stages + sliding underline tabs.
  Closest to the landing hero card, but three surface layers was the
  heaviest option; the flat cube card reads cleaner in a prose column.
- **Dark Console** — always-dark code panel with terminal dots. Strong
  preview/code contrast, but a fixed dark object ignores the theme and
  carries heavy visual weight on the light page.
- **Editorial** — cardless, hairlines and whitespace only. Elegant, but
  demos blur into the prose and lose their boundary; near-monochrome code
  also hid the syntax palette work.

## Consequences

- `ChartDemo` no longer imports github-light/github-dark shiki themes; any
  future code surface can reuse `codeLightTheme`/`codeDarkTheme` with the
  same dual-theme wiring and flip rule.
- The bare-`.dark` compilation bug and the inline-style `var()`
  non-invalidation trap are recorded in `tasks/lessons.md`; the
  `:global(.dark)` pattern in any other component should be migrated to an
  unscoped style block.
