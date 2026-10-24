# MineWorld — local-only texture experiment

This branch is deliberately **not** the GitHub Pages branch. The public game at https://rdcoleuh.github.io/My-Project/ is unchanged. Only importer code and tests are committed here; **no Minecraft PNGs, ZIPs, JARs or proprietary assets** are stored in GitHub.

## What it does

The browser reads a **Java Edition** resource-pack `.zip` or an installed Java Edition `client.jar` you select yourself. It scans `assets/minecraft/textures/block/*.png`, uses the original PNG pixel art for the matching faces in the MineWorld WebGL atlas, and leaves other MineWorld blocks as they were. Pack images are never uploaded, committed, cached to a server or saved to localStorage. To restore the original textures, use the **Restore MineWorld textures** button or reload the experimental page.

MineWorld's block IDs, dimensions, world saves, hotbar, crafting, hunger, mobs and inventory are unchanged. The imported pixels are exact only when the source texture is already 16×16; high-resolution pack art is resampled to the game's existing 16×16 atlas using nearest-neighbor filtering. Animated vertical sprite strips currently use their first frame. Some Minecraft textures (such as chest entity sheets, special translucent overlays and complex block models) don't fit MineWorld's block-face atlas and are left as original art.

## Run on a Windows computer

1. In VS Code's terminal, clone the experiment branch:

   `git clone -b experiment/local-minecraft-textures --single-branch https://github.com/rdcoleuh/My-Project.git MineWorld-Texture-Lab`

2. `cd MineWorld-Texture-Lab`
3. `python -m http.server 8000`
4. Open **http://localhost:8000/** in Chrome or Edge.
5. Open **Options → Local Java texture pack experiment**, or start a world and open **Pause → Local Java texture pack experiment**.
6. Select a Java Edition client JAR from your **own installed copy**, typically:
   `%APPDATA%\.minecraft\versions\<version>\<version>.jar`
   Or choose a Java Edition resource pack ZIP that contains `assets/minecraft/textures/block/*.png`.
7. Read the status: it shows the count of substituted faces and blocks. Compare the game with original mode.

## Try it on iPhone

Run the above local server on a PC reachable via the same Wi-Fi. Instead of `localhost`, open `http://<computer LAN IP>:8000/` in iPhone Safari. Put a resource pack ZIP you are allowed to use into iPhone **Files** and choose that ZIP in the experimental import control. The imported file stays within your browser session; it is not sent to the server. Safari 16.4 or newer supports the decompression feature required for most ZIPs. Network/firewall configuration may be needed to reach your computer.

## Test

From the experiment directory run `node --test tests/*.test.cjs` (Node 22 or later). The branch has a GitHub Actions regression workflow; no assets are tested or distributed there.

**Copyright/permissions:** This is a local import mechanism, not an authorization to redistribute Minecraft's artwork or a statement that personal/private use is automatically lawful. Check the game terms and any resource-pack license. The importer does not circumvent protection or download Minecraft assets.
