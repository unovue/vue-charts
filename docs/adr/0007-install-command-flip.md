# ADR-0007: Install pill — rotating package managers, split-flap Flip animation

- Status: Accepted
- Date: 2026-10-02

## Context

The landing's install pill showed a fixed `npm install vccs`, but visitors
use pnpm/yarn/bun too. A prototype run (`/proto/install-pill`, since
removed) compared three animation specs for rotating the command; all
variants shared the behavior contract: 2.6s auto-rotate, pause on hover,
click the command to switch manually, copy button copies the CURRENT
command, everything frozen under reduced motion.

## Decision

**Flip** — the `pm + verb` segment (`npm install` / `pnpm add` / `yarn add`
/ `bun add`) flips character-by-character on rotateX with a 28ms stagger
(split-flap), `vccs` static. The pill container FLIP-animates its width via
motion-v `layout` as command lengths change. Copy feedback keeps the cube
face-crossfade.

Shipped as the `InstallCommand.vue` component — rotation, click-to-cycle,
clipboard, and animation in one unit, styled with the global `.ds-pill` /
`.ds-copy` classes.

## Rejected directions (from the same run)

- **Roll** (word rolls vertically) — compact and quiet, but mechanical
  against the mono typeface.
- **Morph** (whole command blur-crossfades) — identical to the hero card's
  chart morph; reusing it a third time on one page flattens the motion
  vocabulary instead of unifying it.

## Consequences

- `index.vue` no longer owns install/copy logic; the pill is
  self-contained and reusable (docs pages can adopt it later).
- motion-v `layout` on the pill is a deliberate exception to the "no FLIP
  on text" call made for the code card (ADR-0006): the width delta is
  small (~20%) and the concurrent character flip masks any squash.
