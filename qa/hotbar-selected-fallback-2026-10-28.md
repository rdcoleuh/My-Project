# Partial imported hotbar: selected-slot fallback (2026-10-28)

## Reproduction
A partial HUD provider can supply a valid nine-slot background image without
individual slot sprites or a selected-slot PNG. The hotbar enters
`mw-pack-bar-image` mode, but the later generic
`#hotbar.mw-pack-hotbar .hot-item.active:not(.mw-pack-selected)` CSS rule
clears the earlier selection outline. As a result, the active slot is not
visually distinguishable. The normal importer generally slices valid sheets,
so this regression targets a deliberately incomplete synthetic HUD adapter.

## Fix
Add a square, centered, pointer-transparent `::after` outline specifically
for background-only imported hotbars without an imported selected sprite.
Keep imported selection sprites authoritative; preserve the existing slot
focus outline, touch targets, labels, and world saves.

## Verification
- Node regression: `tests/hotbar-selected-fallback.test.cjs`.
- Desktop and mobile Chrome: `scripts/browser-smoke.cjs` injects a
  **synthetic** 180×20 generated bar background with no slot or selection
  sprites, checks the computed square outline, captures screenshots, and
  restores the previously loaded pack.
- The main browser suite separately imports independently generated ZIP
  texture fixtures covering hearts, hunger, items, mobs, and block faces.
- No user-provided Minecraft resource pack is available in this runner.
- The browser test is an adapter-fixture check, not a real before/after
  gameplay recording or an endgame playthrough.

The GitHub Actions run for this commit is the source of test and artifact
status; do not infer success solely from the presence of this log.
