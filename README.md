# MineWorld 4.7 — Adjustable Render Distance & Classic Pixel Materials

**Play:** https://rdcoleuh.github.io/My-Project/

MineWorld is an original block-based Survival and Creative browser game, not the proprietary Minecraft Java or Bedrock game. It runs on desktop, iPhone and iPad; peer-to-peer public multiplayer remains experimental.

## Crafting

In **Survival**, open the Backpack / Gear panel. You start with a **2×2 crafting grid**. Select an item in the backpack or the "Holding" dropdown, then tap a crafting square to add that ingredient; tap it again to clear, or Shift+tap on desktop to add another unit to that cell. The output button only crafts a matching, affordable recipe. A recipe search below the grid can lay out ingredients as an optional guide without automatically consuming them.

Craft a **Crafting Table** with a 2×2 square of 4 planks, then tap **Place Crafting Table**. Being within approximately four blocks of a placed table unlocks the **3×3 grid**. Aim at the table and tap Mine/Interact to reopen the table. Workbench recipes (pickaxes, swords, furnaces, doors, chests, etc.) follow traditional shaped voxel crafting arrangements. Other original MineWorld catalog recipes may use compact ingredient stacks as recipe shortcuts rather than exact Minecraft shapes; furnaces and smithing have their own simplified crafting flows.

Creative stays independent; Survival resources and crafted items cannot be transferred into Creative.

## Texture and biome improvements

- The original procedural **16×16 pixel texture atlas now paints all 168 block indices**, fixing blank or incomplete textures for the End, villages, crops and structures.
- Refined original grass, soil, sand, and stone texture patterns; added pixelated wooden crafting-table faces.
- Grass and common foliage colors respond to environment (cold taiga, yellow-green savanna, swamp, jungle, meadow).
- Overworld terrain now uses **irregular seeded biome boundaries** instead of repeating rigid square sections, with smoother transitions between hills, plains and coastlines.
- The existing 36 Overworld biome categories, biome Atlas, original trees, landmarks, mountains, caves and custom world seeds remain supported.
- Existing edits still load, but newly generated *unmodified* terrain may change appearance in previously explored places due to the biome-generator update. When a prior save is opened, the game attempts a one-time local backup named `mineworld-backup-before-biome-v37-<mode>` before migrating. These backups remain in that browser's local storage and are not uploaded to a server.

## Limitations

Crafting behavior and recipes are improved but are **not the entire official Minecraft recipe registry**. World generation and pixel-art textures are original approximations, not identical to Minecraft terrain generation or official textures. Multiplayer remains peer-hosted rather than a persistent dedicated server; shared crafting inventories are not server-authoritative. Different generator versions with the same seed can have different naturally generated layouts.

The website includes no Microsoft/Mojang code or original copyrighted texture-pack assets.

## 3.8 title screen redesign

The initial screen is redesigned in the spirit of classic voxel-game Java menus: a **large original MINEWORLD stone-style wordmark**, gently panning procedurally drawn block landscape, Singleplayer, Multiplayer, Creative World, Options and World Atlas. Singleplayer opens the existing Creative/Survival world-and-seed chooser; Multiplayer opens the existing public/private lobby. Options provides a panorama-motion toggle, full-screen attempt (where supported), and control reference. Returning home restores the main title screen.

The menu landscape, texture, lettering and art are independently generated and do not use Mojang/Minecraft assets or fonts. Gameplay and saves are unchanged by the menu-only update.


## 3.9: Survival hotbar earned through pickups

- A **new Survival world begins with nine empty hotbar slots**; the Creative preset block palette is no longer visible in Survival.
- Mining, loot chests, mob drops, farming, crafting and other inventory gains now fill empty Survival hotbar slots automatically. Multiple items of a type stack in the same slot; counts reflect what is actually owned.
- The first nine owned item types occupy the hotbar, and additional items remain in the 36-slot-per-page backpack. Open **🎒 Inventory** (or press E / tap Gear) to choose a different item. Select a stack and tap **Equip / Assign Hotbar** to assign it to the highlighted slot.
- Any type of backpack item, not only placeable blocks, can be assigned. Food can be eaten with the mobile PLACE button while held in Survival. Block placement consumes an owned block. Newly crafted tool items are now recorded in the inventory and can be equipped from the hotbar.
- Hotbar slot assignments save with your **Survival-only** world. Older saves migrate to inventory-backed slots using their genuinely owned resources; Creative remains unlimited and unchanged.
- The 10,000×10,000 seeded world, iPhone/iPad controls, multiplayer, crafting, Nether and End remain part of MineWorld. The game is still independent of Minecraft and does not use Mojang assets.


## MineWorld 4.0 — timed mining and crafting fixes

- Survival block breaking now takes actual time, with a visible progress bar. Click once to begin a break; hold the mouse button or touch MINE button to continue mining blocks. The active block and held tool must stay the same while a break is in progress. Switching targets or tools resets progress. Creative still breaks blocks instantly.
- All accessible blocks except the protected y=0 foundation can be broken with hands or any tool tier. Speed increases in this order: hand, wood, stone, iron, gold, diamond, netherite. Tough materials take longer. Mineable ore and other drops flow through the owned-item inventory so they appear on the Survival hotbar when space is available.
- Hostile creatures acquire visible Survival players within **25 three-dimensional blocks**, checking blocks between the creature and player for line of sight. Opaque blocks prevent new targeting; water and glass do not. Detection is recalculated a few times per second. Public multiplayer still uses peer-hosted simulation and has no 24/7 dedicated host.
- **Crafting fixes:** 2×2 inventory grid versus 3×3 only near a placed crafting table; tapping repeatedly adds ingredients, the **− Remove** toggle subtracts them; chosen ingredient defaults to an available owned item; taking the output consumes inventory ingredients once and clears the virtual input grid. Closing crafting now clears virtual ingredient reservations without losing items.
- The **Place / interact** control (right-click on desktop or PLACE on mobile) opens a targeted crafting table, chest, or dimension portal; the **Mine** control breaks it. A crafted table is placed on nearby clear ground using the gear panel's **Place Crafting Table** button.
- Existing Creative and Survival save formats are not replaced by this update. The map, inventory, seed, dimensions and multiplayer integrations remain unchanged.

**Limitations:** These mining times and craft recipes are original MineWorld approximations, not Mojang's exact hardness and recipe database. Combat and crafting have not been checked on a physical iPhone or with two real remote multiplayer devices.


## 4.1 — Uncluttered pause menu and original 16px block materials

**Pause menu**
- Only the **⏸ Pause** button remains in the upper-right corner of live gameplay (within iPhone safe-area insets). The crosshair, health/hunger, collected-item hotbar and mobile movement/action controls stay visible.
- Pausing opens a compact game-menu overlay organized into **Inventory & Crafting**, **Explore & Travel**, and **Friends & World Settings**.
- Inventory, blocks, gear and recipes, Nether, End, biome atlas, villages, multiplayer, saving, difficulty, creative flight, world mode, home screen and new-world actions remain accessible.
- The menu scrolls on short mobile screens and adapts from 2 columns to 1 column for portrait smartphones. **Resume Game** returns to gameplay; Escape still toggles the game menu on desktop.

**Pixel materials**
- The pixel-materials.js file supplies 16×16 pixel-art materials for **every defined game block**, all independently generated. The file is precached for offline/Home Screen play.
- Detailed texture families include top/side/bottom grass, cobbled and smooth stone, dirt, sand, spruce/birch/cherry bark grain and end-grain, wooden planks, leaf clusters, ores with larger veins, deepslate, Nether materials, End stone, farmland, crop stages, glass, decorative workstations, and many others.
- Texturing uses **nearest-neighbor** WebGL filtering, pixelated hotbar thumbnails, deterministic procedural variation and coherent 16px motifs rather than indiscriminate smooth gradients.
- These are original textures inspired by familiar voxel-block aesthetics. They are **not** copies of official Minecraft textures or a pixel-exact reproduction of the official game's copyrighted pixel patterns.

The existing 10,000 × 10,000 worlds, Survival/Creative saves, inventory, crafting, mobs, shared multiplayer and Nether/End generation are preserved. Physical-iPhone behavior and Internet peer-to-peer combat still require real-device checks.


## 4.2 — Pickups stack at 64 and consume to zero

- Inventory is opened from a large **🎒 INV** button located immediately to the right of the nine-slot hotbar, including on iPhones.
- Survival inventory now has real per-stack entries with distinct stable IDs. **All placeable blocks stack to 64 items**; further pickups create additional stacks of the same block (for example 130 stone becomes **64 + 64 + 2**).
- Individually nonstackable equipment and transportation objects get separate 1-item stacks. Other ordinary collectible materials generally stack to 64.
- Hotbar slots refer to specific stacks. Placing or eating uses one item from the chosen stack; when that stack reaches **zero**, its hotbar slot empties. A second stack stays available in the backpack or another slot, not infinitely refilling the first.
- A fresh pickup automatically occupies a free hotbar slot when it creates a new stack. A full hotbar leaves excess stacks in the backpack. Manual selection from backpack assigns exactly that stack to a chosen slot.
- Crafting and trading still use total resources, taking the costs from owned stacks; dropping a single item or a full stack targets the selected stack.
- Legacy inventory totals and older name-based hotbar assignments migrate to the new ID-based stacks. Stack entries and IDs are saved with the Survival world (version 11).
- Item storage has 36-slot **pages**, so the total number of pages is not yet limited to Minecraft's fixed inventory capacity. Aggregate per-item totals currently cap at 65,535, and displayed hotbar stack counts cap at 64.

## Improved pixel-art materials

- Refined 16×16 game-original textures with larger hard-edged pixel clusters instead of smooth color noise; richer grass/dirt edges, more irregular rocky cobblestone, clearer ore flecks, distinct tree and leaf patterns, and improved End stone.
- Every defined block type keeps its own original nearest-neighbor texture. Hotbar tile thumbnails now sit squarely aligned to the 16px atlas instead of being rotated.
- MineWorld does not ship or reuse official Minecraft texture files; these are independently authored approximations of the same recognizable blocky aesthetic.


## 4.3 texture remake

The entire 16×16 texture atlas has been revalidated across all 168 defined MineWorld block types. The new original artwork replaces generic random-noise colors with hand-arranged pixel motifs, distinct palettes and per-face variants.

- Grass and podzol: recognizable green top, irregular hanging grass fringe on earthy sides, dark underside.
- Stone and deepslate: hand-designed dark-light mineral patches; cobblestone and blackstone: outlined chunky stone shapes.
- Wood: individual oak, spruce, birch, acacia, jungle, cherry, pale oak, crimson and warped species, with vertical bark, species highlights, and rings on log ends.
- Ore faces: separate coal, iron, copper, gold, redstone, lapis lazuli, diamond, emerald, quartz and Nether gold shapes against stone/deepslate.
- Leaves: distinct green and pink clustered foliage; planks: visible seams and grain; snow, ice, sand, gravel and terracotta: cleaner hard-edged pixel coloration.
- Nether and End: netherrack, basalt, soul sand, magma, portals, nylium, wart blocks, end stone, End gateways and crystal details.
- Crafting table, chests, stone bricks, glass, resource blocks and workstations have stronger visual signatures.
- The game retains nearest-neighbor filtering, separate top/side/bottom UV mapping, the same saved block IDs, and all existing 64-item stack behavior.

This work is an independent classic 16x16 pixel-art approximation. No official Minecraft resource files, textures, or copyrighted pixel patterns are copied or included. Water, glass and portal transparency/animation still differ from the original game because the MineWorld engine currently renders opaque block faces.


## MineWorld 4.4 — classic-style block art refinement (October 24, 2026)

The existing pixel-art engine is preserved and now includes an additional original-art rendering pass for the most familiar blocks, while all other materials continue to use 4.3's distinct texture families.

- Grass blocks have a higher-contrast grass top with an uneven green overhang down a brown dirt side.
- Stone, deepslate, blackstone and cobblestone have larger hand-shaped-looking rock regions instead of uniform speckled textures; cobblestone uses jagged, outlined stone pieces.
- Ore rocks have clear distinct coal, iron, copper, gold, redstone, lapis, diamond, emerald, quartz and Nether-gold colored clusters; the ores remain embedded in stone or deepslate.
- Wood has more recognizable birch markings, grooves in bark, end grain, plank seam rows and type-specific timber colors. Leaf blocks are grouped into readable foliage patterns.
- Crafting table, furnace, glass, water, lava, obsidian, sandstone, soul sand, End stone and resource blocks receive additional clear details.
- **Preserved gameplay:** Inventory button beside the hotbar, 64-block stacks, Survival saves, Creative building, 3×3 crafting, mining break timers, mobs, multiplayer, dimensions, and all 168 block IDs remain unchanged.

This is original pixel art modeled on familiar block-based motifs and does not include or copy the official Minecraft texture files. It aims for better recognizability, not an exact copyrighted texture replica. MineWorld still has limitations in transparent water/glass rendering and fluid animation versus Minecraft.


## 4.6 visual finishing pass

This update further improves individually drawn 16×16 original block textures. It corrects podzol to a brown surface, makes the dirt side of grass blocks retain its natural brown color instead of inheriting grass biome tint, and removes random per-position shading so carefully chosen pixel palettes stay crisp. Wood, ore, brick, chest, crafting-table, and Nether/End textures from earlier releases remain in place.

Glass now has transparent interior pixels instead of a solid pale-blue texture. WebGL uses alpha testing to reveal the terrain behind the pane and emits neighboring opaque block faces so visible geometry does not disappear behind glass.

The world, seeds, existing block identifiers, inventory and 64-item stack logic are unchanged. The shader and generated atlas passed syntax/simulation checks; physical-device rendering remains to be verified.

These are independently authored texture approximations, not official Minecraft texture assets. Water and fluid animations are still simpler than Minecraft, and partially transparent materials do not have full order-independent transparency.


## MineWorld 4.7: 10–50 render chunks and adaptive performance

The **Options** screen and the in-game **Pause → Friends & World Settings** section both have a working **Render distance** slider with a 10–50 chunk range. A chunk is a 16×16-block region; the setting is the **total number of nearby chunks to display**, not a 50-chunk radius. The saved setting applies to both Creative and Survival in the same browser. Defaults are 18 on touchscreen devices and 32 on desktop.

**Automatic optimization** is enabled by default, with a checkbox to disable it. It measures recent frame rate and may temporarily reduce the active visible-chunk count (down to 10) when FPS is low. It restores chunks gradually when performance recovers. The setting displays requested range, current active chunks, loaded chunks and recent FPS. User preference and auto toggle persist separately from saved worlds.

Rendering refinements:
- A deterministic nearest-first, world-edge-safe chunk planner produces exactly the requested count for large regions.
- One new chunk loads per frame on touch devices; desktop loads up to two per frame when conditions permit.
- At most one chunk mesh rebuild per touch frame and two desktop meshes, with a millisecond-time ceiling for extra rebuilds.
- Meshing no longer calls world-generation logic for adjacent chunks: only cached visible neighbors are checked, and neighboring edge faces are refreshed when chunks stream in.
- Far-away chunks behind and well outside the camera's view are culled before drawing.
- Adaptive render resolution on slow devices and distance-matched fog reduce visible abrupt terrain edges; unused chunk GPU buffers and data are evicted with a bounded cache.
- A high render setting is a **maximum quality preference, not a guarantee of lag-free performance** on all phones or hardware. Automatic optimization can limit the active count to keep gameplay responsive.

Pixel textures were further refined with original 16×16 textures: bark and log end-grain for more wood species, oak/spruce boards, foliage clusters, sandstone bands, glowing magma cracks and End-stone pits. These are independent Minecraft-inspired pixel patterns, not Mojang assets.

**Verification:** Script syntax, planner determinism, 10–50 visible counts and boundary behavior, no extra chunks from mesh-neighbor reads, cache cap under movement, and all 129,024 atlas pixel color values were tested. Physical iPhone graphics and long-running 50-chunk frame rates have not been measured on a physical device.
