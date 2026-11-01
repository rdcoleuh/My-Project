# Native signed deep-world terrain generation — 2026-11-01

## Problem
The staged 384-layer stream accepted negative chunk coordinates but required a caller-supplied generator. The built-in biome generator rejected negative X/Z chunks and decoded saved edits using the fixed 10,000-wide positive world. This prevented signed profiles from using real terrain, caves, ore bands, bedrock, and structure generation.

## Change
Pass optional signed world bounds through the existing 16×16 chunk generator and ore pipeline. Use those bounds for chunk validation, world-edge decoration/structures, and save-edit decoding. Remove the temporary custom-generator requirement in the deep chunk streamer. Keep the old defaults (0..9999 X/Z, 48 layers in live gameplay) and do not migrate saved worlds.

## Regression checks
New tests cover deterministic native signed chunks, a continuous Y=-64 bedrock floor, deep stone, negative-coordinate edits at Y=-64/63/319, eviction/reload, invalid geometry and corrupt edits, and unchanged legacy generation. The existing signed-stream test now checks missing biome dependency rather than requiring a custom generator.

## Limits
This is an opt-in staged generator/stream bridge, not a switch to the live renderer, collision, multiplayer, or legacy save migration. The normal game still uses H=48, SEA=14. CI and browser smoke results must be checked independently after pushing. No user texture pack is included.
