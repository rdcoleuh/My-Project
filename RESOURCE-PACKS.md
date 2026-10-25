# MineWorld — Player-supplied Java resource packs and animation

MineWorld has original procedural block art and sound by default. A player can optionally load **their own** Java Edition client JAR, compatible ZIP resource pack, or extracted PNG/OGG files. No Minecraft or Eaglercraft assets are bundled, downloaded by the game, uploaded, or saved in the repository.

## Importing

1. Visit https://rdcoleuh.github.io/My-Project/ and open the **Import local textures and sounds** panel on the welcome screen, Pause menu, or Options.
2. Select a ZIP/JAR containing `assets/minecraft/textures/block/*.png` (modern) or `assets/minecraft/textures/blocks/*.png` (legacy). You may also choose multiple extracted PNG files or a local folder.
3. MineWorld matches imported sprite names to its 169 block IDs and their three atlas faces. Unmatched faces keep independently authored MineWorld artwork.
4. The status reports replaced block faces, blocks, animated faces, and imported sounds. Open **Inspect all unmatched block faces** to see the exact Java PNG filename needed for each missing top, side, or bottom face across all 169 MineWorld block IDs. **Restore original art & sounds** returns to the default artwork.

A Java JAR may contain modded namespaces. MineWorld restricts ZIP **and extracted-folder** matching to `assets/minecraft/` (or standalone texture filenames / a plain `textures/` ZIP root), so `assets/othermod/textures/block/stone.png` cannot override vanilla stone. Farmland uses dirt sides, deepslate uses its distinct top, and chiseled sandstone and grindstone use more appropriate top/side/bottom sprites. The **red bed (block 169)** is not red wool: Java's real bed art is stored as an entity texture, not a conventional block PNG, so MineWorld retains its independent bed art unless a custom pack supplies `red_bed_top.png`, `red_bed_side.png`, and `red_bed_bottom.png` (or `bed_top.png`, `bed_side.png`, and `bed_bottom.png`). Similarly, MineWorld's fictional poplar log and raw mineral crate no longer inherit unrelated vanilla oak and barrel sprites.

Legacy Java client JARs (before the 1.13 texture-name flattening) are supported through historical sprite-name aliases. Examples include `workbench_top.png` → crafting table, `furnace_front_off.png` → furnace, `hardened_clay.png` → terracotta, `quartz_ore.png` → Nether quartz ore, and `crops_7.png` → ripe wheat. Modern filenames take precedence if both old and new assets are present. This improves compatibility without embedding or redistributing any textures.

For exact grass block layering, the importer draws `grass_block_side.png` first and composites the transparent `grass_block_side_overlay.png` with a biome tint. When supplied, `textures/colormap/grass.png` and `textures/colormap/foliage.png` determine the plains colors of neutral grass and foliage. Colored custom-pack sprites are not recolored.

## Keep your original Java textures between visits

After selecting a Java Edition ZIP/JAR, check **Remember this ZIP/JAR on this device** before importing. MineWorld stores the player-supplied archive in that browser's IndexedDB, then automatically reapplies its textures and animations on later visits. The option is **off by default**; a normal import remains memory-only. Nothing is uploaded to the game server or committed to GitHub.

Browser private mode, storage quotas, unsupported browsers, or cleared site data can prevent persistence. MineWorld still imports the pack for the current session if saving fails. **Restore original art & sounds** also clears the remembered archive. Individual extracted PNG/folder imports are temporary and replace any previously remembered ZIP/JAR.

## Java-style animated PNGs

The importer now supports sprite strips with accompanying animation metadata, such as:

- `assets/minecraft/textures/block/water_still.png`
- `assets/minecraft/textures/block/water_still.png.mcmeta`
- `assets/minecraft/textures/block/lava_still.png` and its matching `.png.mcmeta`

The metadata can specify `animation.frametime`, a custom `animation.frames` order with per-frame `time`, `animation.interpolate`, and explicit `animation.width` / `animation.height` frame dimensions. Horizontal and multi-row sprite sheets are supported; frame indexes run left-to-right and then top-to-bottom. Frames advance at Java's 20-tick-per-second timing, uploading only changed 16×16 GPU tiles. On slow devices updates are throttled, but the timeline still advances. Transparent imported PNGs no longer show underlying procedural pixels.

**Limitations:** The imported artwork is resampled to MineWorld's 16×16 atlas tiles. Java resource-pack model JSON, arbitrary block-state variants, custom renderers, emissive overlays, and all special-case animation behaviors are not yet reproduced. Interpolation uses canvas blending rather than a byte-for-byte copy of Minecraft's renderer. Some MineWorld blocks do not have a matching Java block. Player-supplied ZIP/JAR archives persist only when the player explicitly enables on-device IndexedDB storage; otherwise all imports are temporary. No native Eaglercraft `.epk` support. Only use files you have the right to use.

## Gameplay and verification

MineWorld also has independent sound synthesis and an original Java-style melee model with weapon attack speeds, partial-charge damage, falling critical hits, grounded sword sweeps, and knockback against locally simulated mobs. Sweeps now only reach nearby targets at a similar height, instead of striking creatures more than a block above or below the primary target. Peer-hosted multiplayer mob hits and PvP now also use the independent Java-style attack-speed and recharge formulas, calculated from the host's elapsed time rather than client-supplied damage. The third-person player arm swings around its shoulder on hits and misses. Third-person mining now has repeated arm strokes during timed survival block breaking and a single stroke for instant creative-mode breaking; these are visual only and do not alter mining speed, combat recharge, or save data. This is not a fully authoritative anti-cheat server: clients still report their equipped gear, and Java's full animation/combat systems are not implemented.

GitHub Actions regression tests cover resource-pack parsing, animation timing, local GPU tile updates, grass overlay tinting, combat formulas, save-key integrity, and script/offline-cache wiring. These checks do not prove that every browser, device, or gameplay scenario is bug-free.

### Partial resource packs and original animations

Importing a small Java Edition texture pack no longer freezes MineWorld's original water, lava, portal, or luminous block animations. The renderer now tracks which of the 507 atlas faces were actually replaced. Imported faces retain the player-supplied pixels and their Java `.png.mcmeta` timing; unmatched faces keep MineWorld's independent procedural motion. This also works when only one face of a block is provided. Resetting the pack returns all original procedural animations. These improvements do not bundle any original Minecraft image files.

### Direction-specific Java Edition workstation faces

The renderer now supports five *additional* local-only Java sprite faces in unused atlas slots: `furnace_side.png`, `blast_furnace_side.png`, `smoker_side.png`, `crafting_table_side.png`, and `cartography_table_side2.png`. After a player imports a pack containing them, furnaces and smokers show front art only on their +Z front; crafting and cartography tables use distinct X-axis side artwork. Top and bottom mappings stay intact, and all 169 existing block IDs and world saves remain unchanged. This is a first step toward more complete six-directional block mapping; placed block rotation/orientation is not yet represented in saved block metadata. The five alternative sprites are **not** bundled in MineWorld and will still use independent default artwork until the player imports them.

## Smooth textures or classic sharp pixels (6.16)

The Pause menu and title-screen Options now offer a **Smooth textures** checkbox (enabled by default). Smooth mode uses linear GPU sampling of MineWorld's atlas and ordinary browser canvas scaling, so close block edges and pixel transitions look less harsh. Turn it off to restore the original sharp nearest-neighbor pixel-art presentation. Your choice is remembered in the current browser and works on mobile and desktop; importing, restoring, or automatically reloading your own Java texture pack does not reset it. The filtering is display-only: it does **not** alter the underlying PNGs, replace block art, edit save files, or make procedurally generated textures identical to Java Edition. If you want to inspect exact imported 16×16 pixels, select **Classic sharp pixels**; Minecraft Java's familiar pixels are intentionally crisp rather than blurred. Smooth mode does not yet add mipmaps or full-screen anti-aliasing, and mobile devices may reduce their game resolution under load.
