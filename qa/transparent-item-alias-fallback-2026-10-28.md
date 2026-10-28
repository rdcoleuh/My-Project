# Transparent imported item icon recovery — 2026-10-28

## Reproduction
Load a player-supplied Java ZIP/JAR or Bedrock pack containing a fully transparent `textures/item/beef.png` and a visible `textures/items/beef_raw.png`. Before this fix, the first named sprite could be returned as a transparent data URL, hiding the hotbar or inventory item. A transparent `cooked_beef.png` could similarly suppress the original procedural icon.

## Change
The item importer checks alpha **after** animation-frame cropping and nearest-neighbor centering, rejects empty output, and tries the next player-imported alias. Block-item candidate names also try their next mapping if the first image is blank or corrupt. Cached results are tied to the requested item and pack generation. No copyrighted bitmap files are stored in this repository.

## Verification
Node regression cases exercise transparent-only fallback, alias recovery, and caching. Desktop and mobile Chrome smoke tests load a clearly labeled independently generated ZIP fixture and check actual decoded output pixels. Browser screenshots are saved to the workflow artifact. These checks are synthetic; no user-provided Minecraft pack is available in CI. A full survival-to-final-boss playthrough is not covered by these tests.
