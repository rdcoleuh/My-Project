# Glazed terracotta furnace integration and Netherrack wood exploit — 2026-11-01

## Reproduced against gh-pages f6d30d9548fe66c3855505c381c0ac6798915054
The catalog advertised a Glazed Terracotta recipe at a furnace with both terracotta and dye, but the three-slot engine has only one input and rejected `block:25` outright. The UI therefore could not complete the advertised recipe. Separately, the catalog's Dark Planks recipe consumed `block:50`, which the live block registry identifies as Netherrack, allowing stone from the Nether to become wood.

## Fix
Add the generic MineWorld `block:25` → `glazedTerracotta` ten-second furnace recipe, excluding this decorative input from blast-furnace ores. Align the catalog's example fuel requirement with the real one-input furnace, preserving arbitrary accepted fuels in the actual UI. Remove the Netherrack-to-Dark-Planks recipe until a legitimate dark log exists. Previously crafted or placed Dark Planks remain supported. Update the service-worker cache version.

## Verification plan and limitations
Node regression tests cover recipe eligibility, timing, deep-Y save/reload, inventory conservation, catalog consistency and exploit prevention. Desktop/mobile Chrome smoke adds a placed-furnace cook, output collection and synthetic resource-pack screenshots; see GitHub Actions run for actual results. This is a generic uncolored glazed-terracotta item, not full dyed-terracotta color parity. The browser fixture is independently generated, not a user-owned Minecraft texture pack. The playable Overworld remains 48 layers; this change does not enable experimental deep terrain. Dedicated pre-fix browser video was not captured.

## Browser smoke correction
The first CI browser run failed because the new glazed-terracotta test furnace was placed at the existing cartography-table regression fixture's coordinates. The real furnace persisted as intended, making the cartography assertion detect a machine. Move the new test furnace one cell away and explicitly remove it after collecting output; retain the cartography assertion unchanged. Re-run the full desktop/mobile pipeline.
