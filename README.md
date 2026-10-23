# MineWorld Together — multiplayer voxel sandbox

**Website:** https://rdcoleuh.github.io/My-Project/

MineWorld Together is an original block-building game that runs directly in the browser. It is **not Minecraft Java Edition 26.3** and does not contain Minecraft's proprietary game code, textures, servers, or brand assets. It is inspired by voxel-building games and some themes from the latest Minecraft update.

## Features

- Self-hosted WebGL world and original procedural terrain
- Forests with colorful autumn poplar trees, beaches, water, shrubs, and mushrooms
- Creative building, mining, Survival-style resource inventory, plank crafting
- 18 block types through two nine-slot hotbar pages (press **E**, or tap **Blocks**)
- Jumping, flying, 3D other-player avatars, day/night sky, mobile touch joystick and buttons
- Save your solo world or host world locally in your own browser
- **Play together**: Host a peer-to-peer room, copy the invitation URL, have up to six friends connect from their browsers, mine/build together, see each other's positions, and use chat

## Play online with friends

1. Open the site, choose **Friends** → **Create Room**.
2. When the status shows **Room created**, choose **Copy Invite Link** and message the link to friends.
3. Friends open the link on their device, enter a name and click **Join Room**.
4. Once the world downloads, they tap **Back to Game** and **Play Now**. Block changes and players are shared.
5. Keep the host's tab/device connected. If the host leaves, the shared session ends.

**Important limitations:** GitHub Pages only hosts static files. Multiplayer uses the MIT-licensed [PeerJS](https://peerjs.com/) client, loaded on demand from jsDelivr, and the free PeerJS Cloud signaling server to connect players by WebRTC. A relay or signaling service may be needed in restricted networks; no guaranteed connection across all NAT/firewall setups, and no always-online server, account system, grief protection, moderation, anti-cheat, or cross-play with genuine Minecraft. Room links are not passwords. Do not share them publicly. Players should avoid real names or sensitive messages in chat. This has not been verified on a live connection between two remote devices.

The host maintains the authoritative copy of the saved world for the room, while each guest keeps their own pre-existing solo save intact. If guests leave, their shared session ends; don't rely on the guest browser for backups. **There is no built-in play time limit**. Multiplayer requires internet access and support for WebRTC, and the free signaling service has no uptime guarantee.

## iPhone / iPad

Open the website in Safari, Share → Add to Home Screen. Touch joystick controls movement, swiping looks around, and jump / mine / place buttons interact with the world. Multiplayer rooms are experimental on Safari/iOS and can fail on some networks. Landscape mode recommended.

## Developer files

- `index.html` — complete original WebGL voxel game and user interface
- `multiplayer.js` — original room, chat and synchronization code; PeerJS library is fetched when needed
- `manifest.webmanifest`, `apple-touch-icon.png`, `favicon.svg` — installable website assets
- `sw.js` — offline-first caching of the solo game shell; multiplayer never works offline

## Legal

Not affiliated with Mojang Studios, Microsoft, Minecraft, PeerJS or any Minecraft third-party port. This website runs an original game and does not enable access to official Minecraft servers or copyrighted builds.