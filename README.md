# MineWorld 2.5 — Biomes, Trees & Landmarks

**Play in a browser:** https://rdcoleuh.github.io/My-Project/

MineWorld is an independent, original 3D voxel sandbox for iPhone, iPad, and desktop. It has **Creative and Survival** modes, mining/building, health/hunger, crafting, animals, combat, and public/private browser-hosted multiplayer.

## World Atlas: 36 compact surface regions

The world has a 6 × 6 grid of themed environments inspired by Minecraft's overworld ecology, including frozen ocean, snowy plains, ice spikes, taiga, old-growth spruce forest, stony peaks, birch forest, dark forest, cherry grove, pale garden, meadow, plains, dappled forest, flower forest, savanna, desert, badlands, jungle, bamboo jungle, mangrove swamp, swamp, mushroom fields and more. Tap the **compass (🧭)** in-game or the **Explore Biome Atlas** button on the home screen to inspect the map and travel to any region. There are also **three simplified subterranean cave styles** (mossy/lush, dripstone, sculk/deep dark), though these are not fully developed cave biome simulations.

Each environment has distinct surface blocks, terrain elevation, and vegetation where appropriate. Generated tree/plant styles include oak, birch, spruce, pine, tall spruce, dark oak, acacia, jungle, poplar, cherry, pale oak, mangrove, giant mushrooms, bamboo, cacti and ice formations. These are block-built, original approximations, not copies of the original game or its tree schematics.

## 24 generated structure sites

World generation creates 24 explorable miniature landmarks, including a village, desert temple, jungle temple, woodland manor, shipwreck, ruined portal, witch hut, cabins, igloo, ruins, campsite, mineshaft entrance, bridge, watchtowers, and more. They are **non-interactive simplified structures**, not complete reproductions of Minecraft structures with chests, puzzles, NPCs, or fully implemented interior gameplay.

**Important scope limitation:** The map is a **miniature Overworld sampler**, not the complete biome/dimension catalogue. It does not yet include every Minecraft biome variant, the Nether or End dimensions, portals to other dimensions, complete cave generation, or all official structures. The real Minecraft Java Edition contains many more biomes and structures.

## Save migration

MineWorld automatically migrates previous v2.4 edits from the old 64×64×27 coordinate format to the new 96×96×36 world and preserves player supplies where possible. The original pre-upgrade save JSON is preserved in browser storage under `mineworld-backup-before-biomes`. Because terrain has changed, old buildings may appear in different surroundings, or may require adjustment. Worlds are saved per browser/device, not synchronized permanently online.

## Multiplayer

The same world seed creates the same biome locations, trees and structures, so connected peers see matching starting terrain. Block edits, creatures and supported combat events remain synchronized using the existing PeerJS/WebRTC browser-hosted session. Public sessions require a player to host them and disappear when that host leaves; this is **not** a continuously running dedicated game server. Real cross-device gameplay on an iPhone has not been independently verified in this update.

## Performance and compatibility

The 96×96 world is intentionally smaller than Minecraft's infinite worlds to run inside mobile browsers. Original pixel-art textures are generated on-device by `texture-atlas.js`; the environments are built deterministically by `world-biomes.js`. The service worker stores core game files for return visits. Online multiplayer still needs an internet connection and the external PeerJS signaling service.

Safari: Open the site, tap Share → Add to Home Screen → Add. On other devices, open the link in a modern WebGL-enabled browser. Older phones may have low frame rates.

## Rights

MineWorld is a fan-made original block-building game, **not Minecraft Java Edition**, not officially affiliated with Mojang or Microsoft, and does not distribute any Minecraft source code, proprietary textures, or game assets.