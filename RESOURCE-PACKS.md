# MineWorld — Player-supplied Java resource packs and animation

MineWorld has original procedural block art and sound by default. A player can optionally load **their own** Java Edition client JAR, compatible ZIP resource pack, or extracted PNG/OGG files. No Minecraft or Eaglercraft assets are bundled, downloaded by the game, uploaded, or saved in the repository.

## Importing

1. Visit https://rdcoleuh.github.io/My-Project/ and open the **Import local textures and sounds** panel on the welcome screen, Pause menu, or Options.
2. Select a ZIP/JAR containing `assets/minecraft/textures/block/*.png` (modern) or `assets/minecraft/textures/blocks/*.png` (legacy). You may also choose multiple extracted PNG files or a local folder.
3. MineWorld matches imported sprite names to its 169 block IDs and their three atlas faces. Unmatched faces keep independently authored MineWorld artwork.
4. The status reports replaced block faces, blocks, animated faces, and imported sounds. **Restore original art & sounds** returns to the default artwork.

For exact grass block layering, the importer draws `grass_block_side.png` first and composites the transparent `grass_block_side_overlay.png` with a biome tint. When supplied, `textures/colormap/grass.png` and `textures/colormap/foliage.png` determine the plains colors of neutral grass and foliage. Colored custom-pack sprites are not recolored.

## Java-style animated PNGs

The importer now supports sprite strips with accompanying animation metadata, such as:

- `assets/minecraft/textures/block/water_still.png`
- `assets/minecraft/textures/block/water_still.png.mcmeta`
- `assets/minecraft/textures/block/lava_still.png` and its matching `.png.mcmeta`

The metadata can specify `animation.frametime`, a custom `animation.frames` order with per-frame `time`, and `animation.interpolate`. Frames advance at Java's 20-tick-per-second timing, uploading only changed 16×16 GPU tiles. On slow devices updates are throttled, but the timeline still advances. Transparent imported PNGs no longer show underlying procedural pixels.

**Limitations:** The imported artwork is resampled to MineWorld's 16×16 atlas tiles. Java resource-pack model JSON, arbitrary block-state variants, custom renderers, emissive overlays, and all special-case animation behaviors are not yet reproduced. Interpolation uses canvas blending rather than a byte-for-byte copy of Minecraft's renderer. Some MineWorld blocks do not have a matching Java block. Player-supplied assets are not persisted across reloads. No native Eaglercraft `.epk` support. Only use files you have the right to use.

## Gameplay and verification

MineWorld also has independent sound synthesis and an original Java-style melee model with weapon attack speeds, partial-charge damage, falling critical hits, grounded sword sweeps, and knockback against locally simulated mobs. Multiplayer damage remains host-validated and can differ from single-player rules.

GitHub Actions regression tests cover resource-pack parsing, animation timing, local GPU tile updates, grass overlay tinting, combat formulas, save-key integrity, and script/offline-cache wiring. These checks do not prove that every browser, device, or gameplay scenario is bug-free.
