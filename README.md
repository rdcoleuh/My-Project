# MineWorld 3.0 — 10,000 × 10,000 Custom-Seed Worlds

Play: **https://rdcoleuh.github.io/My-Project/**

An independently coded voxel browser game for iPhone, iPad, and desktop with both Creative and Survival, simplified biome/structure generation, and peer-to-peer public multiplayer sessions.

## New in MineWorld 3.0

- **World bounds:** X and Z coordinates from 0 to 9,999 inclusive — a 10,000 × 10,000-block surface footprint. Vertical range: 48 blocks. This is 100 million possible columns, **not 100 million columns loaded simultaneously**.
- **Chunk streaming:** load/generate **16 × 16-block chunks** around the player, retaining a small memory cache and disposing distant GPU buffers; show 3 × 3 chunks on touch devices or 5 × 5 on desktop. Additional chunks load as you walk or teleport.
- **Custom seed input:** Type a number or text, or select Random. Same seed reproducibly generates the same biome placement, elevation, trees, caves, ore, and simplified structures. Numeric seed IDs are 1–99,999,999; text seed labels hash to a numeric ID. This is **MineWorld's own seed algorithm**, not Minecraft's.
- **Biome Atlas:** the 36-biome list now finds matching regions in the larger world instead of 36 tiny sections all packed into one 96 × 96 map.
- **Save migration:** an older saved world is backed up locally under `mineworld-backup-before-10k`. The previous edited blocks are translated near the new spawn point. Local saves only store seed, world edits, and progress; distant terrain can be regenerated. Migrated regions can look different from the original terrain.
- **Multiplayer:** the three public-session IDs are versioned for 3.0, keeping incompatible older-version peers separate. Peers receive the same world seed and block edit log; monster combat remains host-coordinated. Sessions still close when the browser host leaves.

## How to create your world

1. Open the link in Safari/Chrome/Edge. On iPhone, you may choose **Share → Add to Home Screen**.
2. Enter a **World Seed**, e.g. `pumpkin kingdom`, `12345678`, or `Ocean Builders`. Or tap **Random**.
3. Tap **New World** to regenerate, or tap **Play Creative / Play Survival** and confirm the new seed.
4. To explore, move normally or open the 🧭 **Biome Atlas**. World coordinates appear on screen. The same seed reproduces the generated terrain across devices.

## Limits

- The 10k footprint is procedurally generated on demand and is not an infinite world. The game has a **48-block vertical ceiling** and simplified caves/landmarks. Biomes cover 36 original approximations of familiar categories.
- Saving uses **browser local storage**, so large numbers of modified blocks can exceed the browser quota. Worlds are not backed up online. Public-world block changes last only for the peer-hosted session.
- The **public lobby is not an always-on, dedicated server**. PeerJS signaling/WebRTC may fail on restrictive networks. Public sessions and gameplay across different real devices have not been verified here.
- This is an original Minecraft-inspired game. **It does not contain or run Mojang/Microsoft Minecraft Java game code or texture files**, and its seed algorithm is independent of Minecraft Java Edition.

## Source files

- `index.html`: original game, menus and client-side chunk streaming
- `world-chunks.js`: 10,000² coordinate generator and custom seeded biomes, trees and structures
- `multiplayer.js`: public/private peer-to-peer sessions, shared edits and combat
- `sw.js`: offline shell cache / Home Screen integration
- `manifest.webmanifest`, `apple-touch-icon.png`, `favicon.svg`: installable web-app metadata and artwork