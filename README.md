# MineWorld 2.0 — Public Multiplayer Worlds

**Play the site:** https://rdcoleuh.github.io/My-Project/

MineWorld 2.0 is an **original self-hosted 3D voxel game** inspired by block-building games. It is not Minecraft Java 26.3 or a redistribution of Microsoft/Mojang game files.

## Public multiplayer (browser-hosted sessions)

1. Open the site in Safari, Chrome or Edge and select **Public servers / Friends**.
2. Enter a display name and choose **Evergreen**, **Sunset Valley**, or **Highlands**.
3. First player to join becomes the session host. Later visitors to that same public world connect to the host automatically.
4. Play together: player positions, block edits, world snapshots, and chat synchronize over WebRTC. Up to 7 concurrent players per world (host plus 6 guests).
5. You can share the public server URL (use **Copy Invite Link**) or just tell friends which world to join.

**Limitations:** These are **open, public, peer-hosted multiplayer sessions**, not 24/7 dedicated servers. The hosting player's browser must remain open. When the host leaves, players disconnect; a new public session can be started by the next visitor, and earlier session changes are not stored on a permanent server. A player on a restrictive network may not connect. There is no moderation, anti-cheat, permanent global world storage, or matchmaking count from a backend. Do not post personal information in chat. Public worlds allow visitors to edit each other's blocks.

The program uses a PeerJS WebRTC library loaded from jsDelivr and the free PeerJS Cloud signaling service. This server only introduces browsers; real-time gameplay data travels over direct WebRTC channels if reachable. The core game/terrain, world rules, rendering and UI run on **your GitHub Pages website**. Internet is required for multiplayer. No built-in time limit.

## Also included

- Private invitation-code rooms, using the existing **Create Private Room** / **Join With Code** buttons
- 18 block types, two hotbar pages, procedural forests, water, original poplar trees, resource collection and plank crafting
- Mining, placement, moving 3D player avatars, day/night sky, optional flight and saveable solo worlds
- iPhone/iPad touch joystick, touch actions, mobile-friendly public-lobby cards and Add to Home Screen PWA
- Solo world stored only in browser. Joining a public session does not replace your solo save.

## Real always-on public servers

GitHub Pages serves static files only. A full persistent 24/7 public server would require an independently hosted real-time backend, persistent database, moderation, rate limiting and ongoing infrastructure. This version delivers public **live sessions** without that backend, not a permanent server.

## Testing status

JavaScript syntax and lobby UI were tested locally, including mock session hosting. This does not prove real connectivity between different physical devices or network providers. See the game status message after joining to verify your live session; all players must use the same site and public world.

## Source

- `index.html`: main WebGL game and responsive UI
- `multiplayer.js`: original public/private room logic (PeerJS/WebRTC)
- `sw.js`: offline shell cache, no offline multiplayer
- `manifest.webmanifest`: PWA configuration

Unofficial, not affiliated with Mojang Studios, Microsoft, PeerJS or Minecraft.