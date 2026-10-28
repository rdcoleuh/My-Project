# Mushroom Fields spawn parity — 2026-10-28

## Source comparison
Minecraft Wiki: https://minecraft.wiki/w/Mushroom_field (reviewed 2026-10-28).
Mushroom fields naturally spawn mooshrooms rather than ordinary farm animals; the biome excludes natural hostile spawns. Exceptions such as spawners, commands, and creatures entering from adjacent biomes are separate mechanics.

## Reproduced source defects
- `animal-behavior.js` treated Mushroom Fields as ordinary cow/sheep/pig/chicken habitat; `pickNatural` could choose those livestock.
- The host's periodic Overworld hostile-spawn loop in `index.html` did not inspect the target biome, allowing nighttime zombies/skeletons/spiders/creepers in Mushroom Fields.

## Change and verification
- The natural passive picker now selects the existing mooshroom species in Mushroom Fields. The ordinary livestock habitat rule excludes those fields.
- The host checks the target biome before selecting a naturally spawned hostile mob, leaving other biomes, Creative summoning and incoming mobs untouched.
- Added `tests/mushroom-biome-parity.test.cjs` for the pure functions and host wiring.
- No changes to saves, resource-pack assets, texture UVs, or multiplayer guest authority.

## Remaining differences
- Mooshroom group size and mycelium-specific spawn rules remain unverified.
- Cave/underground ambient mobs, hostile spawn exceptions and full Java/Bedrock spawning weights remain unverified.
- Node and browser CI, Pages deployment, and recordings must be inspected after commit; code inspection alone does not establish gameplay victory or live-browser parity.
