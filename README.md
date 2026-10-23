# MineWorld 3.7 — 2×2 Inventory Crafting, 3×3 Workbench, Improved Biomes

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