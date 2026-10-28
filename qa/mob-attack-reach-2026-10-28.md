# MineWorld mob-combat regression log — 2026-10-28

## Scope and baseline

Code inspected on `gh-pages` at `5650f7b8e37c41051b6859a71d49038c678b3f51`.
This is a **code-level reproduction**, not a claim of a recorded pre-fix
survival fight. No user-owned Java/Bedrock pack was available in CI.

## Reproduction in the previous implementation

1. Host simulation calculated `dist = hypot(m.x - target.x, m.z - target.z)`.
2. Melee attacks checked `dist < 1.55`. With a mob at (0,2,0) and a
   visible player at (1,6,0), the horizontal distance was 1, so the
   distance gate passed despite a four-block vertical gap.
3. Projectile attacks checked `dist >= 2 && dist < 11`. A ranged mob
   at (0,2,0) and visible player at (6,15,0) passed the horizontal gate,
   despite a true distance greater than 14 blocks.
4. Blaze, ghast and wither did not use the ranged spacing branch of
   `targetIntent`, so they approached instead of holding firing range.

## Fix

Commit `2c8ffa8dfe9bf082e5de4c386c1a4580bfdfb7ee` adds
`attackInReach` to the pure mob rules and connects it to host attacks.
Melee requires horizontal distance <1.55 and feet-height difference <=1.75;
ranged fire requires horizontal distance >=2 and true 3D distance <11.
Blaze, ghast and wither now retreat below 5 blocks, hold at 5–10 blocks,
and approach beyond 10 while they can see the player.

## Regression verification

Three Node tests check vertical melee limits, three-dimensional projectile
reach and ranged flying-monster intent. The desktop/mobile Chrome smoke
runner checks the same pure rules inside the actual loaded game page.
CI's independent synthetic Bedrock ZIP fixture also checks imported HUD,
items, mobs and blocks, then saves and reloads the pack. Screenshots are
captured from desktop/mobile survival HUDs with that fixture enabled.

## Evidence limits

Chrome checks are **coordinate fixtures**, not a complete combat
playthrough. Recorded HUD/crafting videos are general smoke recordings,
not genuine before-and-after videos of this mob bug. Screenshots contain
independently generated test art, not the player's personal textures.
A full survival progression and final-boss victory have not been verified.
