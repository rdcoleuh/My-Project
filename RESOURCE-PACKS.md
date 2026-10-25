# MineWorld — Player-supplied Java resource packs and animation

MineWorld has original procedural block art and sound by default. A player can optionally load **their own** Java Edition client JAR, compatible ZIP resource pack, or extracted PNG/OGG files. No Minecraft or Eaglercraft assets are bundled, downloaded by the game, uploaded, or saved in the repository.

## Importing

1. Visit https://rdcoleuh.github.io/My-Project/ and open the **Import local textures and sounds** panel on the welcome screen, Pause menu, or Options.
2. Select a ZIP/JAR containing `assets/minecraft/textures/block/*.png` (modern) or `assets/minecraft/textures/blocks/*.png` (legacy). You may also choose multiple extracted PNG files or a local folder.
3. MineWorld matches imported sprite names to its 169 block IDs and their three atlas faces. Unmatched faces keep independently authored MineWorld artwork.
4. The status reports replaced block faces, blocks, animated faces, and imported sounds. Open **Inspect all unmatched block faces** to see the exact Java PNG filename needed for each missing top, side, or bottom face across all 169 MineWorld block IDs. **Restore original art & sounds** returns to the default artwork.

A Java JAR may contain modded namespaces. MineWorld restricts ZIP **and extracted-folder** matching to `assets/minecraft/` (or standalone texture filenames / a plain `textures/` ZIP root), so `assets/othermod/textures/block/stone.png` cannot override vanilla stone. Farmland uses dirt sides, deepslate uses its distinct top, and chiseled sandstone and grindstone use more appropriate top/side/bottom sprites. The **red bed (block 169)** is not red wool: Java's real bed art is stored as an entity texture, not a conventional block PNG, so MineWorld retains its independent bed art unless a custom pack supplies `red_bed_top.png`, `red_bed_side.png`, and `red_bed_bottom.png` (or `bed_top.png`, `bed_side.png`, and `bed_bottom.png`). Similarly, MineWorld's fictional poplar log and raw mineral crate no longer inherit unrelated vanilla oak and barrel sprites.

Legacy Java client JARs (before the 1.13 texture-name flattening) are supported through historical sprite-name aliases. Examples include `workbench_top.png` → crafting table, `furnace_front_off.png` → furnace, `hardened_clay.png` → terracotta, `quartz_ore.png` → Nether quartz ore, and `crops_7.png` → ripe wheat. Modern filenames take precedence if both old and new assets are present. This improves compatibility without embedding or redistributing any textures.\n\nFor exact grass block layering, the importer draws `grass_block_side.png` first and composites the transparent `grass_block_side_overlay.png` with a biome tint. When supplied, `textures/colormap/grass.png` and `textures/colormap/foliage.png` determine the plains colors of neutral grass and foliage. Colored custom-pack sprites are not recolored.

## Java-style animated PNGs

The importer now supports sprite strips with accompanying animation metadata, such as:

- `assets/minecraft/textures/block/water_still.png`
- `assets/minecraft/textures/block/water_still.png.mcmeta`
- `assets/minecraft/textures/block/lava_still.png` and its matching `.png.mcmeta`

The metadata can specify `animation.frametime`, a custom `animation.frames` order with per-frame `time`, and `animation.interpolate`. Frames advance at Java's 20-tick-per-second timing, uploading only changed 16×16 GPU tiles. On slow devices updates are throttled, but the timeline still advances. Transparent imported PNGs no longer show underlying procedural pixels.

**Limitations:** The imported artwork is resampled to MineWorld's 16×16 atlas tiles. Java resource-pack model JSON, arbitrary block-state variants, custom renderers, emissive overlays, and all special-case animation behaviors are not yet reproduced. Interpolation uses canvas blending rather than a byte-for-byte copy of Minecraft's renderer. Some MineWorld blocks do not have a matching Java block. Player-supplied assets are not persisted across reloads. No native Eaglercraft `.epk` support. Only use files you have the right to use.

## Gameplay and verification

MineWorld also has independent sound synthesis and an original Java-style melee model with weapon attack speeds, partial-charge damage, falling critical hits, grounded sword sweeps, and knockback against locally simulated mobs. Sweeps now only reach nearby targets at a similar height, instead of striking creatures more than a block above or below the primary target. Peer-hosted multiplayer mob hits and PvP now also use the independent Java-style attack-speed and recharge formulas, calculated from the host's elapsed time rather than client-supplied damage. The third-person player arm swings around its shoulder on hits and misses. This is not a fully authoritative anti-cheat server: clients still report their equipped gear, and Java's full animation/combat systems are not implemented.

GitHub Actions regression tests cover resource-pack parsing, animation timing, local GPU tile updates, grass overlay tinting, combat formulas, save-key integrity, and script/offline-cache wiring. These checks do not prove that every browser, device, or gameplay scenario is bug-free.
