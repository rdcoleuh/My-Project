# Signed deep-world chunk streaming — November 1, 2026

## Reproduction
The coordinate codec and ore generator accepted signed X/Z coordinates, but the staged deep chunk stream rejected chunk (-1,-1), clipped neighborhood loading at zero and rejected negative-coordinate collision boxes. A signed world therefore could not stream terrain across X/Z=0.

## Change
The opt-in deep stream now accepts a chunk-aligned horizontal origin and width/depth, computes world and chunk bounds from that profile, and applies those bounds consistently to residency, collision sampling, swept movement and neighborhood loading. Saved edit indices use the matching signed codec. The default 10,000×10,000 positive world remains unchanged. Signed profiles require a caller-provided generator because the built-in biome generator still rejects negative chunk coordinates.

## Regression coverage
`tests/deep-signed-stream.test.cjs` covers negative X/Z edits and eviction replay, zero-crossing mesh invalidation, bounded neighborhood loading, unloaded-vs-solid swept collision, malformed profiles, and legacy defaults.

## Limitations
This is experimental infrastructure, not an activation of Y -64 through 319 in live gameplay. The built-in generator, multiplayer, save migration, live renderer and mobile performance need separate integration and verification. No proprietary game art is included. Browser smoke recordings exercise existing playable gameplay, not signed deep-world traversal.
