# HUD legacy atlas alpha regression — 2026-11-02

## Reproduction
A player-imported Java `textures/gui/icons.png` may contain opaque unrelated pixels but fully transparent heart/hunger cells. The previous importer validated the 9x9 crop coordinates without checking that the selected glyph contained any visible alpha. This allowed invisible imported icons to override MineWorld's original heart and hunger fallback.

## Fix
Validate the alpha of each *cropped* 9x9 legacy glyph, not the entire atlas, before accepting it. Invalid/transparent crops return `null` so the ten-heart and ten-food fallback remains visible. Keep the existing nearest-neighbor scaling and alpha compositing. No copyrighted bitmap art is included.

## Tests
- New Node regression checks synthetic transparent and opaque 256px/512px atlas cells, and the importer guard.
- Desktop and mobile Chrome smoke suites now import an independently generated fully transparent Java-style legacy icon atlas, verify all six imported HUD variants return null, and confirm ten fallback hearts and ten fallback food icons remain rendered. Capture desktop/mobile screenshots.
- Existing imported legacy icon atlas and Java/Bedrock pack checks continue in the same workflow.

## Limitations
This fix is specific to transparent legacy GUI glyphs. No player-owned pack is available in CI, so browser tests use clearly labeled original synthetic fixtures. A full survival progression playthrough and deep-world integration are not covered by this change.
