# Imported hotbar nine-cell alpha validation — 2026-11-02

## Reproduction
A synthetic 182x22 or 180x20 player-imported GUI background with only its first cell painted previously passed the full-bar alpha check because the importer tested for any opaque pixel. This could replace the nine-slot procedural background with a mostly transparent imported sheet.

## Fix
The original MineWorld UV helper now checks visible alpha separately in all nine source-aligned cells, including the top and bottom border for border-only packs. The check applies to modern nine-cell backgrounds and cropped legacy widgets atlas backgrounds. Numbered/generic slot sprites still use independent validation and fallback. The importer bounds the decoded canvas and does not redistribute proprietary artwork.

## Tests and limitations
Node regression tests cover 1x/2x/4x bordered and seamless sheets, blank/partial/complete art, unrelated opaque atlas pixels, and malformed RGBA. Browser smoke evidence (if uploaded by Actions) uses independently created synthetic packs, not a user's imported textures. No dedicated pre-fix recording was captured. The change does not activate the experimental deep-world system or alter furnace mechanics.
