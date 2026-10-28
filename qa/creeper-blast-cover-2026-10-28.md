# Creeper blast cover regression — 2026-10-28

## Reproduction and root cause
The previous creeper explosion loop used only 3D distance to damage every nearby
player, without checking terrain between the creeper and player. A solid wall
could therefore block pursuit and sight but not explosion damage.

## Fix
The host simulation now samples three bounded supercover voxel rays from the
creeper to each player's lower body, torso, and head. The existing transparent
block rules are shared with mob sight. Fully opaque cover blocks damage;
partial cover attenuates it. A zero-exposure explosion does zero damage.
This changes neither saved-world format nor client multiplayer authority.

## Checks
- Pure Node regression: clear, solid-wall, partial-cover, invalid and zero-damage cases.
- Desktop/mobile Chrome smoke: the same synthetic wall fixtures in the browser.
- Browser smoke continues importing an independently generated Bedrock ZIP.
- Gameplay video artifacts are general HUD/crafting recordings, **not** real
  before/after footage of a creeper blast. No personal Java/Bedrock pack was
  available to this run. A full survival-to-boss playthrough was not executed.
