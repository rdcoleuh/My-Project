# Furnace opening/transition persistence — 2026-10-31

## Reproduction
The previous furnace UI called `engine.ensure(position,kind)` on opening, but did not call `api.onChange()` unless an inventory transfer occurred. A new furnace or a corrected furnace/smoker/blast station could therefore exist only in memory until another save trigger. The engine correctly converted remaining fuel, but the save dirty flag was not set by the conversion.

## Fix
`ensureStation` now validates creation/conversion before displaying the panel and invokes `onChange` exactly when a station is newly created or its kind changes. Reopening an unchanged station does not produce redundant saves. Invalid positions/kinds cannot open a phantom panel. Existing slot contents and fuel-conversion rules remain unchanged.

## Verification
Six new Node regression cases cover initial creation, idempotent reopening, burning furnace conversion and restored progress, invalid stations, preserved inventory, and real UI wiring. Automated tests use original MineWorld logic without proprietary assets. Browser smoke recordings, when available, are general gameplay evidence and not a dedicated before/after capture of this defect.
