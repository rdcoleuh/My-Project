# Furnace mobile picker and imported slot icons — 2026-10-29

## Reproduction
The furnace UI rebuilt both native select elements' option nodes every 250 ms while open. This can close a mobile ingredient/fuel picker during selection. The three slot displays also showed only two-letter placeholders despite an available player-imported item PNG.

## Change
Preserve option nodes while available keys are unchanged, updating quantity labels in place. Show local player-imported item/block PNGs in the three furnace slots, with original MineWorld isometric block art and accessible text as fallbacks. Cache per resource-pack generation and discard stale asynchronous image results. No proprietary assets are bundled.

## Verification limitations
Node regression tests cover picker node identity, quantity updates, imported-art precedence, fallbacks, and DOM/CSS wiring. CI desktop/mobile Chrome smoke recordings are general gameplay evidence, not a filmed before-and-after reproduction of a native mobile picker. Resource-pack fixtures are independently created, not the player's own pack. Deep-world live integration and final boss playthrough remain outside this change.
