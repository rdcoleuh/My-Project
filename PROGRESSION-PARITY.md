# MineWorld progression parity and verification tracker

This is an implementation tracker, **not** a claim of Java or Bedrock parity. All artwork must be original or loaded locally from a player's own resource pack; no proprietary assets are committed.

## Verification labels
- **Source present**: relevant implementation exists in this repository; this does not prove browser gameplay.
- **Automated test present**: a test file exists; passing status must be checked against the specific commit's workflow.
- **Unverified**: requires executable desktop/mobile playthrough.
- **Not complete**: known design gap or missing end-to-end proof.

## Ordered milestones

| Priority | Feature / expected behavior | Current evidence | Acceptance gate |
| --- | --- | --- | --- |
| P0 | Furnace, smoker and blast furnace: input, fuel, output, fuel/burn/cook timers, inventory conservation, save/load, XP collection | Source present in `furnace-engine.js`, `furnace-ui.js`; automated tests in `tests/furnace-gameplay-flow.test.cjs`, `tests/furnace-atomic-transfers.test.cjs` and related files | Open station in desktop and mobile Chrome; insert fuel/ore, watch smelt, collect output, reload, compare inventory/XP; record actual test |
| P0 | Full Overworld Y -64..319 with sea level 63, deep caves, ores, bedrock and efficient chunks | **Not complete**: furnace position validation already accepts this Y range, which is not equivalent to world support | Audit all world indexing, coordinate conversions, generation, lighting, mesh/chunk bounds, physics, save formats and multiplayer; migrate old worlds without changing their existing terrain |
| P1 | Nine-slot hotbar, selection, item icons, ten hearts and ten hunger icons (0–20, halves) | Source and tests must be re-audited at each revision | Verify nearest-neighbor pixel art, transparent UV/atlas crops, touch targets, screen-reader labels, zero/half/full values and save persistence |
| P1 | User-imported Java ZIP/JAR and Bedrock pack artwork for GUI, items, blocks and mobs | Import pipeline requires end-to-end validation | Test pack load and each texture category using an explicitly identified independent fixture when no user pack is provided; never label fixture as user artwork |
| P1 | Crafting table and inventory: recipes, stacking, tabs, transfers, save/load | Unverified gameplay | Craft tools from gathered materials with touch and mouse, test invalid recipes and reload |
| P2 | Mob spawning, navigation, targeting, attack/retreat, drops, skins and animations | Unverified gameplay | Test passive and hostile mob lifecycle in both browsers; capture before/after clips for reproduced defects |
| P2 | Overworld biomes, structures, farming, ores, caves, weather, day/night | Unverified gameplay | Seeded-world checks, terrain/structure assertions, screenshots and performance budgets |
| P3 | Nether, End, portals, bosses and full survival progression | Unverified gameplay | New-world survival playthrough through endgame; do not report boss defeat without actual recorded execution |

## Save-safe deep-world implementation sequence

1. Inventory every use of `H`, `SEA`, dense block index, world array, Y bounds, and block-edit serialization in `index.html` and multiplayer code. Record legacy coordinate conventions and migration version.
2. Introduce explicit signed world coordinates and a versioned storage adapter. Preserve legacy world edits at their original positions. Keep existing worlds playable before switching terrain generation.
3. Generate chunks on demand, including negative-Y subchunks; avoid allocating a full 384-high dense world on mobile. Add vertical culling and a bounded mesh/texture budget.
4. Set new-world sea level to 63; implement deep caves, ores, and bedrock with deterministic seeded generation. Preserve legacy sea level and terrain unless the player explicitly creates a new world or opts into migration.
5. Validate collisions, raycasting, mining/placing, liquids, light, spawn positions, saves, network coordinates, and transitions at Y=-64, 0, 47, 63 and 319.
6. Run Node tests and desktop/mobile Chrome smoke tests; verify deployed Pages at the exact commit. Record performance and failures.

## Evidence and reporting discipline

For each change, record commit SHA, test command/result, Pages deployment result, and reproducible bug steps. Prefer short before/after gameplay recordings with screenshots and verified GitHub artifact links. If no browser recording is available, say so. Source inspection, CI success, and real gameplay are separate evidence levels. Never claim a full playthrough or completed feature from source inspection alone.
