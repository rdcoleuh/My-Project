# Signed deep-world ore chunks — 2026-11-01

## Reproduction and change
The ore generator previously discarded every negative X/Z anchor, even though the
experimental deep-world coordinate codec supports signed origins. It also decoded
saved edits with a fixed 10,000-block positive origin and restored only positions
above the lowest three layers, silently dropping player edits at the bedrock floor.

The generator now accepts optional minX/minZ/width/depth, uses absolute coordinates
for deterministic vein hashes, indexes protected edits with the chosen signed
world dimensions, and restores valid player edits at every Y. Legacy defaults
remain 0..9999 in X/Z, with the same 48-layer ore distribution. No live save
migration or gameplay depth switch is performed.

## Tests
Run `node --test tests/signed-overworld-ores.test.cjs` and the full Node suite.
Chrome desktop/mobile smoke workflows remain separate. They use independently
created texture-pack fixtures, not player-owned packs.

## Limitations
This is an opt-in deep-world ore-generation building block. Live Overworld
terrain, chunk meshing, collision, lighting, save migration, and multiplayer
still require a coordinated 384-layer integration. This change alone does not
make negative-X/Z chunks or deep ores playable.
