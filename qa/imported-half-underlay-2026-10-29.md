# Transparent imported half-heart underlay — 2026-10-29

## Reproduction
With a player-imported resource pack that supplies only a full heart sprite (and no half/empty sprite), lose one health point to reach 19/20. The renderer correctly clips the imported full heart to half, but previously left MineWorld's **filled** procedural half-heart behind it. Transparent pixels in the imported sprite could therefore reveal red filled pixels that were not part of the imported artwork.

## Fix
Keep the procedural half-heart when no pack sprite is available. Once an imported half sprite or a clipped imported full sprite resolves, replace the procedural filled-half underlay with the original **empty** outline, then layer the imported art above it. Existing pack identity/generation and DOM-connection checks still prevent stale asynchronous writes.

## Verification criteria
The Node regression checks require an empty procedural underlay for imported half art. Desktop/mobile Chrome smoke tests import an independently generated full-only synthetic pack, damage the player to 19/20, and compare two canvas pixels against the original empty glyph (not merely opacity). Both modes retain the accessible Health: 19 of 20 label and pixelated rendering. Do not represent this fixture as a user's proprietary resource pack.

## Limits
This is a HUD texture correctness fix, not a world-depth, mob AI, furnace, or endgame progression change. CI and Pages verification must be checked after commit.
