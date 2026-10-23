# MineWorld 3.1 — The Nether Expedition

**Live game:** https://rdcoleuh.github.io/My-Project/

Self-hosted independent browser voxel game for iPhone, iPad, and desktop browsers, with Creative, Survival, seeded worlds, and peer-to-peer public multiplayer sessions. This project is NOT Minecraft Java Edition and contains no Minecraft game code, artwork, textures, or music.

## The Nether dimension

Tap **🔥 Nether** in the top toolbar, **Enter the Nether** on the home screen, or **Nether Portals & Biomes** from the in-game menu. Choose **Enter the Nether** to cross, or choose one of the five biome tiles to travel there. The new dimension has its own 10,000×10,000 coordinates, distinct block-edit data, Nether cave shelves, a lava sea, a cavern ceiling, seed-generated fungus trees, blue soul-fire regions, new rocks, ores and original textures.

Five biomes: **Nether Wastes, Crimson Forest, Warped Forest, Soul Sand Valley, Basalt Deltas**.

Procedural landmarks: **Nether fortress** platforms and bridges with blaze/wither-skeleton activity; **bastion remnant** halls with piglin/brute activity; **ruined obsidian portals**; **Nether fossils**; and **lava wells**. Same world seed = same structures and terrain. This is a *simplified original interpretation*, not the precise Minecraft Java generation system.

Nether creature types: ghast, blaze, magma cube, piglin, piglin brute, zombified piglin, hoglin, zoglin, strider, wither skeleton, skeleton, enderman, wither boss, ghastling, and happy ghast. Most spawn based on biome/structure; the boss is an optional summon, and ghastlings/happy ghasts and zoglins are summonable in Creative. All have simplified voxel bodies and AI, **not the full behaviors of the original game**. Most Nether hostiles can pursue and damage Survival players. Ghast/blaze/Wither attacks use simplified distance attacks, not complex projectile simulation. Loot supports quartz, gold, blaze rods, magma cream, pearls, and skulls. Trade gold via the Nether menu, and summon a Wither boss in Survival using 3 skulls and 4 Soul Sand.

### Controls

- **Desktop:** Use the Nether button in menus (press **Esc** if your mouse is locked in the game). Use WASD/mouse, mine/build normally, and press R to attack.
- **iPhone / iPad:** Use the 🔥 icon or **Menu → Nether Portals**, and the joystick / touch action controls. In Survival, use the HIT button for nearby mobs.
- **Return:** Select **Return to the Overworld** in the Nether menu. Your overworld and nether positions and modified blocks are stored separately.

### Save compatibility

Local Overworld saves from 3.0 load into 3.1. On first successful load of an old save, MineWorld attempts a browser-local backup under `mineworld-backup-before-nether`. New saves store both `edits` (Overworld) and `netherEdits` (Nether), plus the current dimension and last positions. Worlds are stored in browser local storage, **not backed up online**; clearing browser data can erase them. Changes in shared public sessions are transient and not persisted on a dedicated server.

### Multiplayer limits

Public servers are *peer-hosted browser sessions*: the first player hosts; a permanent 24/7 dedicated server is not included. Both dimensions' changed blocks are synchronized. Player position messages include dimension; players only appear and may fight one another in the same dimension. Shared mob simulation is controlled by the session host for the dimension the **host currently occupies**. Guests in a different dimension from the host cannot count on synchronized combat there, and two-device real internet testing remains unverified. PeerJS Cloud / WebRTC are required for multiplayer signaling.

### Performance and rendering

16×16 on-demand chunks and a max 48-block height in both dimensions. On iPhones the game renders a narrower region and unloads distant chunks. The Nether features original generated 16×16 pixel textures and chunk-seeded layouts. The project has passed static syntax, deterministic-generation, bridge/save-edit, and simulated desktop/mobile menu tests. A physical iPhone and live multiplayer across networks have **not** been verified.

### Source files

- `index.html`: client, UI, dimensions, blocks, Survival, mobs, rendering
- `nether-world.js`: deterministic Nether generation with five biomes and structure stamping
- `world-chunks.js`: custom-seeded Overworld generator
- `multiplayer.js`: public/private WebRTC room logic, dimension-aware player state, block edits, mobs
- `sw.js`, `manifest.webmanifest`, `favicon.svg`, `apple-touch-icon.png`: PWA install support