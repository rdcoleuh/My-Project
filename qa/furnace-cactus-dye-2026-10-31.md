# Furnace cactus-to-dye parity — 2026-10-31

## Reproduction before the fix
MineWorld registers a harvestable Cactus block (ID 44) and a generic `dye` backpack item. The furnace's input recipe table did not accept `block:44`, so the Survival furnace picker could not smelt harvested cactus. Adding the recipe without changing the ore classification would incorrectly allow cactus in blast furnaces.

## Implemented change
A normal furnace now cooks one `block:44` into one generic `dye` over ten seconds using existing fuel, three-slot UI and save timers. Cactus is explicitly excluded from the blast-furnace ore set; smokers also reject it. This uses original code and player-imported or synthetic artwork, not bundled proprietary textures.

## Regression and browser coverage
`tests/furnace-cactus-dye.test.cjs` checks ordinary smelting, smoker/blast rejection, save/reload, incompatible outputs, full stacks and browser-test wiring. The desktop/mobile Playwright smoke scenario exercises the actual input selector, waits for dye output, collects it and saves `*-furnace-cactus-dye-synthetic.png` screenshots while the independently created test pack is enabled. The workflow's gameplay video artifacts are general smoke recordings, **not** dedicated before-and-after videos.

## Limitations
MineWorld currently has one generic `dye` item rather than separate color-specific dyes; this recipe does not create a distinct green-dye ID. The live Overworld remains 48 layers (H=48, SEA=14); Y -64..319 is not enabled. No full survival-to-final-boss playthrough is claimed. Browser smoke, deployment and artifacts must be checked from the workflow before they are reported as successful.
