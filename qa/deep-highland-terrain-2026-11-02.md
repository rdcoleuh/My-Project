# Deep Overworld highlands — 2026-11-02

## Problem and scope
The experimental 384-layer generator used the same small biome height variations as the legacy 48-layer world. Its sea level could be 63 and bedrock -64, but Frozen Peaks remained near the plains rather than rising into the available upper elevations. The live game still uses H=48 and SEA=14.

## Change
For **only** H=384, minY=-64 and SEA=63, the generator now adds smooth seeded continental uplift and extra ridge height for Peaks, Slopes, Windswept and Grove biomes; Badlands receive a modest plateau uplift. Ocean terrain is excluded. Existing 48-layer saves and their deterministic terrain are unchanged. No proprietary artwork was used.

## Reproduction and regression
At seed 85721, the Frozen Peaks biome destination (4440,4440) has legacy terrain Y=27 and new deep terrain Y=173. Frozen Ocean stays at deep Y=60. Added tests for these elevations, continuous heights at chunk boundaries, deterministic 384-layer chunk generation, actual solid mountain surface, and the Y=-64 bedrock floor.

## Limitations
This changes the **opt-in generator**, not the live renderer or legacy saves. Live gameplay remains H=48, SEA=14 until a versioned migration and section renderer are safely integrated. Browser smoke footage of the playable legacy world does not demonstrate the deep highlands. No user-provided texture pack was accessible; browser fixtures remain independently generated.
