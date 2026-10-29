# Furnace ore smelting and wood fuel parity — 2026-10-29

## Reproduction (before)
The furnace accepted raw mineral items, sand, cobblestone and a few fuels, but rejected MineWorld's placeable ore blocks, red sand and clay. It also rejected several of the Overworld log types as fuel. This prevented smelting ore blocks obtained through alternate inventory paths and using common wood types in a furnace.

## Fix
Extend the independent MineWorld furnace recipe map with coal, iron, copper, gold, redstone, lapis, diamond and emerald ore blocks (including deep variants), quartz and Nether gold ore, red sand to glass, and clay to terracotta. Support acacia, jungle, mangrove, cherry and pale-oak logs as 15-second fuels. No third-party assets or proprietary code are included.

## Verification
Automated regression coverage in `tests/furnace-ore-parity.test.cjs` exercises each new recipe, all supported log fuels, partial cooking, deep-world coordinates and save/restore. Existing furnace and browser smoke tests must pass in CI before considering this deployed. Browser smoke recordings are general interaction checks, not dedicated before/after ore-smelting footage.

## Limitations
This change does not integrate the experimental 384-layer world into live gameplay, add smelter variants, or introduce a new graphical ore selector. The normal game still uses its legacy world height. Imported texture packs remain user-supplied; automated smoke tests use original synthetic fixtures.
