# MineWorld 3.4 — The End, Villagers, Farming and Treasure

**Play:** https://rdcoleuh.github.io/My-Project/

Independent voxel browser sandbox for iPhone, iPad and desktop; not Minecraft Java Edition. Uses original procedural block graphics and simplified, Minecraft-inspired mechanics. No proprietary Minecraft game code, assets, or exact official loot-table files.

## Dimensions & world generation

- **Overworld:** 10,000 × 10,000 blocks, original 36-region biome generator, structures and villages, plus coal, iron, copper, gold, redstone, lapis lazuli, diamond and emerald ores with depth-biased veins and deeper variants. Different mining tiers produce different drops.
- **Nether:** Five biomes, seed-based terrain, fortress/bastion and other ruins, lava, hostile mobs, ancient debris and Netherite progression. Smelt debris into scrap; combine 4 scrap plus 4 gold into Netherite ingot. Find Netherite Upgrade templates in bastion treasure and upgrade diamond tools using the smithing table.
- **End:** Seeded End main and outer islands, End stone, chorus plants, obsidian dragon crystal spires, a Dragon fight, return portal, cities, ships, shulkers, Enderman and Endermites. Collect Eyes of Ender and activate a stronghold portal in Survival; Creative can enter immediately. End ships yield elytra loot.

## Villagers & farming

Thirteen working professions and their stations: Farmer, Armorer, Butcher, Cartographer, Cleric, Fisherman, Fletcher, Leatherworker, Librarian, Mason, Shepherd, Toolsmith, Weaponsmith. Village residents appear at deterministic locations. Use **🏘 Villages** to find village sites and meet residents. Each profession offers Novice through Master tiers with item-for-emerald and emerald-for-item trades, XP levels, finite stock, and once-per-game-day restocking. **These are original simplified offers, not exact official Minecraft profession tables or dynamic price/reputation AI.**

Village farms contain irrigated fields and wheat, carrots, potatoes, beetroot. Use the Villages **Farming tools** controls to craft a hoe, till dirt, plant seeds, harvest mature crops, bake bread and eat harvested food. Crops have four growth stages. Farmers tend field patches when present. Crop changes are saved as regular world block edits and sent in shared sessions. Trading and villagers are currently simulated by each client independently rather than on a dedicated authoritative server; do not rely on secure/competitive trading on public servers.

## Chests and treasures

The 3D world contains interactable chests in generated villages and other sites. On interaction, a deterministic loot pool corresponding to the structure is rolled and items are awarded once. The chest becomes opened; its state persists in private saves and shares as a block edit in multiplayer. Pools cover multiple Overworld structures, Nether fortresses/bastions and End cities/ships, inspired by major vanilla categories. **The original game's exact loot table probabilities, chest inventories and full number of chests per structure are not implemented.**

## Multiplayer & save limits

Choose **Friends** and join a public world or a private room via PeerJS Cloud signaling and WebRTC data connections. Shared block edits, player positions and host-coordinated creature combat use dimension-aware messages, including End. Browser-hosted public sessions are not permanent dedicated servers: first visitor hosts, the session resets when everyone leaves, and there is no guaranteed moderation or uptime. Players in other dimensions from the host cannot count on perfectly synchronized creature combat. Villager trades/loot grants are not independently verified by the network host. Two-device real internet gameplay and iOS performance have not been verified.

Private local progress is stored in browser localStorage. Old 3.0–3.1 saves can load, with best-effort local backup and automatic migration. If two devices use the same seed, world terrain/structures match; user edits are only shared while players are in the same multiplayer world.

## Install on Apple

Open the site in Safari → Share → Add to Home Screen. Touch joystick, looking swipe, Mine/Place/HIT, hotbar and world menus support phones and tablets. Offline service worker caches the website files; multiplayer requires internet and browser storage is device-local.

## Scope

This is a playable original sandbox with expanded mechanics, **not a complete implementation of every rule, item, animation, AI behavior, villager trade, structure chest, Nether mechanic or boss pattern from Minecraft**. An exact independent port of Minecraft Java would require rights to distribute and run its proprietary code and assets.