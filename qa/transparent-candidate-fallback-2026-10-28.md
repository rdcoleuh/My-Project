# Transparent imported HUD candidate fallback — October 28, 2026

## Reproduction
A player-selected Java/Bedrock ZIP can contain a valid-sized but fully transparent `heart_half.png`, `hunger_half.png`, numbered hotbar cell or selected-slot PNG alongside visible full-heart/full-food, generic slot or legacy GUI atlas art. Before this fix, the first correctly sized transparent candidate was selected; the later alpha guard returned null, discarding usable alternatives and showing procedural artwork instead of the player's visible sprites.

## Fix
Check each decoded HUD candidate's actual alpha channel before accepting it. For atlas textures, probe only the requested crop, preserving native pixel UVs and bounding temporary canvas allocations. Transparent explicit half icons recover from visible full icons, then optional legacy atlas artwork. Transparent numbered slots recover from generic/sheet sprites, and transparent selected frames can recover from legacy widgets. No copyrighted bitmap files are added; all pack content stays local.

## Regression coverage
`tests/hud-only-pack.test.cjs` now models transparent and opaque PNG candidates in a browser-like canvas and checks half-heart, numbered-slot, and selected-slot recovery. `scripts/browser-smoke.cjs` imports an independently generated synthetic Bedrock/Java mixed ZIP in desktop and mobile Chrome, checks the visible recovered sprites and captures screenshots.

## Limitations
The test fixture is independently created, not the user's personal Minecraft pack. General gameplay recordings are not genuine before-and-after captures of this specific defect. A complete survival-to-final-boss playthrough is not claimed. Verify GitHub Actions and Pages status for the final commit before treating deployment as successful.
