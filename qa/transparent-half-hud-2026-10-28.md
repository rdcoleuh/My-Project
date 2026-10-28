# Transparent imported half-heart regression — October 28, 2026

## Reproduction

Start a survival world, take one point of damage, then import an independently generated Bedrock-format pack containing only a full heart and full hunger icon (no empty or half icons). The importer synthesizes a half icon by copying the filled half of the full sprite, leaving the other half transparent. Previously the HUD replaced its fallback canvas with that image, so the unfilled side lost its outline.

## Fix

For half health/food icons, retain the original pixel-art fallback canvas and absolutely overlay the imported half PNG. Full and empty imported icons still replace their fallback. Imported sprites retain nearest-neighbor rendering, correct heart/food fill directions, and existing accessible 0–20 labels. No save-format or copyrighted artwork changes.

## Verification scope

Node regressions check both half-icon rendering paths and CSS; the desktop/mobile Chrome smoke runner loads an original generated full-only fixture, applies real survival damage, asserts the fallback canvas and imported image coexist, checks the outline pixel and accessible label, and captures screenshots. This is a synthetic pack fixture, **not** the user's imported Minecraft textures. The existing workflow records general gameplay, not a genuine before-and-after video of this defect.

Full survival progression, endgame, and final-boss victory remain unverified.
