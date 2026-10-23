# MineWorld 3.5 — Survival-first progression and separate Creative worlds

Play: https://rdcoleuh.github.io/My-Project/

**Survival features are earned through gameplay.** Survival and Creative now have **different local save slots** and independent block edits, inventories, locations, dimension progress, villager trades, crops and seeds. A legacy world is automatically copied into the appropriate slot the first time the new version loads, leaving the original legacy key intact for backup. The last active mode is restored when refreshing the page.

## Play Survival

1. On the home screen, select **Play Survival**. You start with no starter items. Mine trees, craft planks/sticks/tools, gather ores, eat food, farm, trade with villagers, and claim one-time structure chest loot.
2. In Gear & Crafting, make Flint & Steel from iron and flint. Gravel can now drop flint. Mine 10 obsidian with a diamond pickaxe or find it in structures. The Nether menu can build and light a physical 10-obsidian portal frame, unlocking Nether travel. Return to the Overworld through the portal menu.
3. Mine Nether ores and ancient debris, trade, explore bastions for upgrade templates, forge Netherite equipment, fight Nether mobs, and obtain blaze rods and ender pearls.
4. Craft Eyes of Ender, track down a stronghold, place 12 Eyes, and enter the End. Defeat the dragon before using the End exit portal.
5. In Survival, the Overworld Atlas, Nether biome directory, End biome directory, and village board give coordinates only; **they cannot teleport you**. Creative retains instant biome travel.

Survival players cannot enable flight or switch their existing world to Creative. The Mode label in the pause menu is locked; use Home to open the separate Creative save. Creative has unlimited building blocks and travel but cannot claim Survival chests, trades, farming rewards, or boss progression.

**Multiplayer:** public rooms require Survival mode; private rooms require matching modes between host and guest. Nether/End world snapshots include portal progression. Browser-hosted multiplayer is not tamper-proof: there is no dedicated authoritative survival server, and actual multi-device tests are still needed. World save data is stored in each browser's localStorage, not cloud-synced. Older legacy saves remain available under their previous key.

## Limitations

MineWorld is an independently written Minecraft-inspired game, not Minecraft Java Edition. Crafting, structures, loot and mob behavior are simplified; Survival is much richer but not a complete implementation of every Minecraft mechanic. Nether portals are built via an in-game crafting action with 10 obsidian plus Flint & Steel instead of exact frame detection. End progress remains simplified. No official game code or textures distributed.