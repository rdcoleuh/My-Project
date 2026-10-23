# MineWorld 2.4 — Shared Survival Combat

**Play:** https://rdcoleuh.github.io/My-Project/

This is an original Minecraft-inspired browser voxel sandbox. It is **not Minecraft Java Edition** and contains none of Mojang's proprietary textures or game code. It works as a GitHub Pages website on iPhone, iPad and desktop.

## Home menu

Choose **Creative** (unlimited blocks, flying, instant mining) or **Survival** (health, hunger, resources, basic crafting, tool progression, combat, food, and respawning). Select Peaceful, Easy, Normal or Hard; Peaceful disables hostile monster spawning. The game includes eight original low-poly creature species (cow, pig, sheep, chicken, zombie, skeleton, spider, creeper), natural wandering or chasing, 16×16 procedural pixel-art block textures, ores, gear, cooking and mining. It **does not** contain every original Minecraft Survival feature, recipe, biome, structure, animation or mob.

## Online combat — upgraded in v2.4

The first visitor to a public world hosts a session using browser WebRTC/PeerJS. Friends in the same Evergreen, Sunset Valley or Highlands world can now **see the same creatures, hit the same monsters, see shared monster health and deaths, and receive drops if they landed the finishing hit**. Host-side AI picks surviving players to chase and sends damage to them. Health loss and respawning are handled on the affected player's device.

**PvP** (player vs player) is **off by default**. The session host can tap **Friends → ⚔ PvP: OFF** to enable friendly combat. When enabled, both players must be near each other and in Survival mode to deal player damage. The host validates range, timing and mob existence before accepting guest hits, and broadcasts creature state about four times per second. These checks reduce accidental desync and simple attacks; they are **not production-grade anti-cheat**. Because users run the code in their browsers, it cannot guarantee fair play against modified clients.

The host uses their own game for creature AI and receives/replies to guest attack messages. **If the host pauses or leaves, creature AI pauses or the session ends.** Shared mob state is not permanently saved between sessions. Up to seven players per room (host + six guests), not a dedicated always-on server. Reliable matchmaking across NAT/firewalls cannot be guaranteed with free PeerJS signaling. PvP is not moderated and public sessions have no account verification.

### Desktop controls

- **WASD** move; mouse drag / pointer lock look; **Space** jump; **E** change block hotbar; **I** open gear; **Q** eat; **R** attack mob/player; left-click aims/mines/attacks; right-click places; **F** toggles flying only in Creative.
- **Mobile:** on-screen joystick, swipe to look, and dedicated **HIT**, **JUMP**, **MINE**, **PLACE** controls. Tap **Friends** to join a public room. Safari → Share → Add to Home Screen to install a launcher icon.

## Files

- `index.html`: voxel world, gameplay, survival AI, health/hunger, mobile UI, online-combat bridge
- `multiplayer.js`: PeerJS signaling + WebRTC host/guest session and shared mob/combat packets
- `texture-atlas.js`: original, locally generated pixel-art textures
- `manifest.webmanifest`, `sw.js`, `apple-touch-icon.png`, `favicon.svg`: installable offline **game shell**; multiplayer still requires internet

## Testing

JavaScript syntax checks, desktop/mobile UI simulation, and a two-client same-origin network simulation passed the following critical flows: joining a private world, syncing creature snapshots, guest attack on shared mob with synchronized death, server-directed damage to a guest, PvP toggle broadcast, and guest hitting a Survival host. **Not tested on two physical phones over the public Internet**. Real-world connection reliability remains unverified.