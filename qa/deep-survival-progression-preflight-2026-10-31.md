# Deep-world survival and progression preflight — 2026-10-31

## Reproduction before the change
The opt-in 384-layer migration preview copied world edits, furnace inventories, backpack counters and equipment, but omitted saved health, hunger, saturation, exhaustion, difficulty, camera mode, day clock, boss victory, End-eye progress, portal state and advancement achievements. Switching heights from that incomplete plan would risk losing or resetting survival and endgame progress.

## Fix
The preview now exposes frozen `survivalState` and `progressionState` records. Every optional legacy field is retained without coercion, while invalid numeric ranges, unknown modes, impossible End-eye counts and malformed advancement data cause a fail-closed error. Portal coordinates and advancement lists are independently deep-copied so preview consumers cannot modify original save objects. Legacy saves missing these fields remain supported.

## Verification
`tests/deep-survival-progression-preflight.test.cjs` covers preservation, immutability, older saves, invalid meters, invalid progression, accessor rejection, and live legacy-world invariants. Full Node and browser CI and Pages deployment must be verified after the branch update; browser gameplay clips are general smoke evidence, not before-and-after footage of this preview-only defect.

## Limitations
This is **preflight only**. The live world remains H=48 and SEA=14; 384-layer chunk rendering, terrain, collisions, save migration and multiplayer remain unfinished. No complete survival playthrough or boss victory is claimed. Synthetic texture fixtures are not user-provided packs.
