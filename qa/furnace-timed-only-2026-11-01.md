# Timed furnace-only crafting — 2026-11-01

## Reproduction
Seven legacy Survival recipes allowed an immediate ore/food + coal exchange through the crafting interface. Catalog furnace recipes also used the generic instant craft handler. Carrying an unplaced furnace counted as a station, bypassing real fuel burn, ten-second smelting, the three-slot interface and output collection.

## Fix
Mark legacy quick-smelt recipes as furnace-only, exclude furnace recipes from grid craftability, and reject all furnace craft calls before inventory or XP mutation. The recipe list remains searchable and explains how to use a placed furnace. Smithing remains unchanged. Existing saved machines, fuel timers, slots, gameplay and resource packs are preserved.

## Verification
New Node tests execute production craft/preview functions and a real timed furnace save/reload. Desktop and mobile Chrome smoke now exercise the recipe guidance and capture screenshots, alongside existing real three-slot furnace cooking, save, XP, and resource-pack fixture tests.

## Limitations
No pre-fix video was captured. Browser texture tests use independently generated fixtures rather than a user-provided pack. No full survival-to-final-boss playthrough is claimed.
