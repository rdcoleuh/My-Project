# Aquatic movement parity audit — 2026-10-28

Reference: https://minecraft.wiki/w/Mob_AI (aquatic pathfinding in water).
No proprietary assets or source code were imported.

## Reproduced in code
- Previous aquatic locomotion skipped land steering and attempted only its current
  heading. At a bank it could remain pressed against the shore indefinitely.
- Aquatic knockback used the land-height branch, potentially teleporting fish to
  the sea floor when struck near the shore.
- Forward swimming checked for a water voxel but not a collision-free hitbox.

## Changes
- Reuse the bounded eight-heading steering search with a water-column and
  collision probe; never select a dry-bank destination.
- Preserve swimming depth under knockback and require destination water.
- Require a collision-free destination on the actual swimming move.
- Keep existing procedural art, imported texture precedence, saves and multiplayer
  authority unchanged.

## Regression coverage
- Pure steering tests: wet-channel turning and sealed water dead ends.
- Integration assertions: water-only steering, hitbox checks, aquatic knockback,
  cache version and unchanged save key.
- CI browser smoke tests are broad desktop/mobile tests, not targeted aquatic
  playthrough recordings. This audit does not claim full swimming parity.

## Remaining parity gaps
- 3D vertical water pathfinding, species-specific schooling, dolphin surfacing,
  fish flopping, depth/light spawn rules, daytime drowned behavior, and accurate
  aquatic animation remain incomplete.
