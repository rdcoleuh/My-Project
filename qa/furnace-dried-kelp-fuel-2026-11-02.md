# Dried kelp furnace fuel — November 2, 2026

## Scope
The existing three-slot furnace accepts cooked kelp as a food output but lacked a way to compress nine dried kelp into a reusable fuel item. This adds an original MineWorld inventory item `driedKelpBlock` and reversible crafting-table recipes. One item provides 200 seconds of regular-furnace fuel (20 standard smelts); a smoker or blast furnace uses 100 seconds at twice the cooking rate, retaining the same 20-item capacity.

## Reproduction and validation
Before the change, the catalog had no dried kelp compression recipe and `MineWorldFurnace.FUEL.driedKelpBlock` was undefined, so inserting the item into the fuel slot returned zero. The new Node regression suite covers crafting ratios, regular furnace fuel exhaustion after twenty smelts, smoker parity, and mid-cook save/restore.

## Compatibility and limitations
The item is an inventory fuel item, **not yet a placeable voxel**; no proprietary texture is included. Existing furnace saves, world-height settings, multiplayer wire formats, and GUI controls are unchanged. Browser playthrough and texture-pack verification must be reported separately, not inferred from Node tests.
