# MineWorld 4.1 — Pause Menu & 16px Block Textures

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
