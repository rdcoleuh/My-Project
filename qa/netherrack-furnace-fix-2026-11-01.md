# Netherrack furnace recipe/fuel correction — 2026-11-01

## Reproduction
The MineWorld block registry identifies block 50 as **Netherrack**, but the furnace engine previously registered `block:50` as both a charcoal-smelting log and a 15-second fuel. This allowed abundant Netherrack to create charcoal or cook other items. Earlier automated tests mistakenly classified it as a log.

## Correction
Removed `block:50` from furnace recipes, fuel durations and the special ore-exclusion list. Corrected the log and fuel tests to use the actual block registry. Added regressions for rejecting Netherrack as input/fuel, preserving withdrawable Netherrack from legacy saved furnace slots, and smelting normally after those slots are cleared. Bumped the service-worker cache version.

## Verification and limitations
The regression workflow must pass after this commit is pushed; inspect its Node and desktop/mobile Chrome results. Existing browser smoke footage tests real furnaces and synthetic imported texture packs but does **not** reproduce the Netherrack exploit before/after on video. No player-owned Minecraft texture pack was available. This change does not activate the experimental deep-world renderer or change the HUD.
