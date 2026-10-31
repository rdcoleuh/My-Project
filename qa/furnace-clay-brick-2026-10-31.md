# Furnace clay-to-brick parity — 2026-10-31

## Reproduction before the change
The Survival backpack already registered `clay` and `brick`, but the furnace recipe registry did not contain `clay`. Opening a regular furnace with clay in the backpack did not offer clay in the input selector, so bricks could not be smelted.

## Fix
Register one clay ball to one brick in the regular furnace. Do not enable this recipe in smokers or blast furnaces. Reuse the existing three-slot interface, 10-second cook timer, fuel accounting, autosave, and resource-pack icon resolver.

## Regression checks
The new `tests/furnace-clay-bricks.test.cjs` exercises three-item smelting, fuel use, incompatible specialized stations, save/reload, blocked outputs and full output stacks. The desktop/mobile Chrome smoke script now adds a real UI interaction, collects the brick, and saves a screenshot labeled **synthetic** because the pack is independently generated.

## Limits
This does not enable the deep Overworld profile or prove a complete survival-to-boss playthrough. The Chrome smoke run must finish before its screenshots or recordings can be claimed as accessible.
