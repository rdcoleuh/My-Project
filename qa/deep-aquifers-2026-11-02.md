# Staged deep aquifers and lava pockets — 2026-11-02

## Reproduction and implementation
Before this change, the opt-in Y=-64..319 generator carved every deep cave cell to air, including below the intended lava level. The staged profile now uses one independently authored seeded, continuous two-dimensional aquifer sample per column. Carved cells at Y<=-54 contain lava (MineWorld block 66); selected water-table pockets above that level contain water (block 7); other caves remain air. The bedrock floor is stamped afterward, ores only replace stone, and player edits replay last.

The algorithm is deterministic, uses no copyrighted game code or bitmap art, and never runs for the legacy 48-layer profile. One aquifer noise sample per column avoids a per-voxel mobile cost.

## Reproducible fixture
Seed 85721, chunk (314,311), deep profile H=384/minY=-64/SEA=63: in Y=-60..-24, 2,783 water cells, 729 lava cells and 90 air cells. Across the X border between chunks (313,312) and (314,312), water/lava membership agrees in 584/592 sampled cells. The legacy (312,312) chunk FNV-1a checksum remains 0x77e00a1e.

## Limitations
This is **experimental world generation only**: playable index.html still uses H=48 and SEA=14. It does not yet provide a live fluid-flow simulation for the expanded world, and no deep-aquifer gameplay video is claimed. Browser smoke videos exercise the legacy playable profile and synthetic imported resource packs, not these staged caves. Actual GitHub Actions test/deployment outcomes must be checked after pushing.
