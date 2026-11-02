# Deep cave lava-pocket regression — 2026-11-02

## Reproduction

In the experimental 384-layer generator, every carved cave voxel at or below Y=-54 became lava. This made the entire lowest cave band uniformly hazardous, despite the feature being described as lava *pockets*. It also eliminated dry escape passages wherever deep carving occurred.

## Fix

Sample one additional original, seed-dependent 2D noise value per (x,z) column at a short spatial scale. Only carved voxels at Y<=-54 with a lava-field value above 0.46 receive lava; other carved cells remain air. This creates coherent hazards and traversable gaps without per-voxel sampling or changing the 48-layer legacy generator. Player edits still replay after generation.

## Regression gates

- Verify both lava and air in the lowest cave band at a fixed seed.
- Verify deterministic generation and continuity across neighboring chunks.
- Preserve deep bedrock, ore and saved-edit tests, and the legacy chunk hash.
- Run full Node tests and desktop/mobile Chrome smoke tests through GitHub Actions.
- This is **experimental generator behavior only**; playable worlds remain H=48, SEA=14.
- No user-owned resource pack was available; browser tests use independently created synthetic fixtures.
- No complete survival playthrough or final-boss victory is claimed.
