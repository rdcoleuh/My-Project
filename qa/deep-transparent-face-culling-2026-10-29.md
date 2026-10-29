# Deep-world translucent boundary face regression — 2026-10-29

## Reproduction before fix
In the experimental 16x16x16 exposed-face planner, put stone (ID 3) beside glass (ID 9), or place glass across the east/west chunk seam. The old default predicate `neighbor !== 0` hid the stone face behind glass or water, leaving a hole in the future deep-world mesh. Two adjacent glass blocks correctly hid their shared interior, but the rule incorrectly treated every non-air neighbor as fully opaque.

## Change
The default planner now distinguishes a conservative set of original MineWorld translucent IDs (water, glass, leaves, ice, and selected thin/vegetation blocks). A solid block behind a translucent neighbor retains its face; same-type translucent neighbors cull their internal shared face. Custom `occludes` callbacks still take precedence. The planner remains experimental and does not change saved worlds or the live renderer.

## Verification
New Node regression cases cover stone/glass, stone/water, different and matching translucent pairs, cross-chunk planes, and custom occlusion predicates. No browser before/after clip can truthfully demonstrate this experimental geometry change until the planner is wired to live rendering. The user's personal resource pack was not available in this run.
