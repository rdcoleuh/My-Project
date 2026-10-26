## 6.47 — Higher-resolution source textures

MineWorld's private player-selected resource importer now preserves up to **64×64 source texels per block face** on capable desktop GPUs (1024×4096 atlas, about 16 MiB RGBA) when `MAX_TEXTURE_SIZE >= 4096`, the pointer is not coarse, and reported device memory is at least 4 GiB if available. 32×32 faces use the bounded 512×2048 atlas (~4 MiB) when `MAX_TEXTURE_SIZE >= 2048`; touch/coarse-pointer devices never allocate the 64px atlas. Devices limited to 1024 or 1536 use the original 256×1024 atlas with nearest-neighbor downscaling. Animation frames and directional faces use the same chosen resolution; no source bitmap is uploaded off-device. Imported PNGs stay in the user's browser.

## 6.43 — safe Java multipart default cube selection (October 25, 2026)

Player-supplied Java Edition blockstates with a `multipart` array can now select a **single matching full-cube model** when the known default state unambiguously matches one part. Conditions support `AND`, `OR`, and pipe-separated alternatives such as `facing=north|west`; quarter-turn Y rotations, `uvlock`, inherited texture variables, distinct cardinal faces, and face UVs continue through the existing local-only renderer. Unknown properties, unsupported rotations, multiple matching parts (such as fences or panes), and non-cube geometry safely retain MineWorld's fallback textures. No original game bitmaps are shipped, and saves, block IDs, and mobile controls are unchanged.

## 6.42 — quarter-turn Java default blockstates (October 25, 2026)

For player-supplied Java Edition blockstate JSON, MineWorld now accepts default cube-model variants with supported `y` rotations (0°, 90°, 180°, and 270°). Their north/south/east/west textures map to the correct world sides, and the UV direction of top/bottom faces accounts for the turn unless `uvlock` is set. All transformations use imported local PNGs at nearest-neighbor sampling. The block's placement orientation is still fixed; variable per-placement facing, rotated X/Z blockstates, complex multipart geometry, and non-cube geometry are not supported. World save keys and block IDs are unchanged.

## 6.41 — player-imported Java cube face UVs (October 25, 2026)

MineWorld can now apply source `models/block/*.json` face `uv` rectangles and `rotation` values to loaded full-cube blocks. It crops, flips, and rotates UV coordinates rather than resampling the bitmap, so player-supplied textures retain sharp pixels. Missing or malformed artwork leaves MineWorld's existing fallback intact, and restoring original art clears imported transforms.

# MineWorld — Player-supplied Java resource packs and animation

## 6.36 — read Java blockstate defaults from player-selected archives (October 25, 2026)

When a selected Java Edition JAR/ZIP or extracted resource-pack folder contains `assets/minecraft/blockstates/*.json`, MineWorld now checks its `variants` before selecting a simple cube model. For example, a log's `axis=y` variant can point to a differently named vertical model; a lamp's `lit=false` variant can point to the unlit model. The importer reads only the player-provided JSON and PNGs and does not bundle original Minecraft artwork.

The resolver chooses the unrotated variant with typical default properties, preferring an empty variant key. It then follows the referenced `minecraft:block/...` model, its parent chain and texture variables. Unsupported rotated models, missing referenced models, malformed JSON and other namespaces fall back to the earlier direct model or MineWorld's procedural art. This is a best-effort default variant mapping, **not** a full Java blockstate engine: user-selected states, multipart models, per-face rotations and arbitrary model geometry remain unsupported. Existing saves, world IDs and mobile controls are unchanged.

## 6.32 — use local Java block-model texture references (October 25, 2026)

A selected Java client JAR or resource ZIP can now supply `assets/minecraft/models/block/*.json` alongside its PNGs. For simple full-cube models, MineWorld follows local `parent` inheritance and `#texture` variables to choose the pack's referenced top, side, and bottom images, including nested paths such as `textures/block/custom/stone_alt.png`. This allows a pack's model to remap a familiar block to custom player-owned art rather than requiring the filename of the vanilla PNG. Extracted folders containing matching model JSON and PNG files are supported too. Original texture bitmaps are still not bundled or transmitted.

The model resolver intentionally ignores other namespaces, missing or invalid files, unsafe paths, cyclic parent references and non-full-cube geometry. Directional models with different north/south/east/west images do not collapse those four textures into one side tile; MineWorld's existing fixed workstation directions remain in use. This is **texture-reference support**, not a complete Java model/blockstate renderer: arbitrary geometry, blockstate variants, UV rotations and placed-block orientation remain unimplemented. A model reference only overrides a face when its referenced PNG is actually available; otherwise the earlier per-block mapping remains. The import report counts faces successfully resolved through local model JSON. The atlas, existing world-save keys and mobile controls remain unchanged.

MineWorld has original procedural block art and sound by default. A player can optionally load **their own** Java Edition client JAR, compatible ZIP resource pack, or extracted PNG/OGG files. No Minecraft or Eaglercraft assets are bundled, downloaded by the game, uploaded, or saved in the repository.

## 6.29 — resilient PNG aliases and model-specific side UVs

When a modern Java texture filename exists in a selected ZIP/JAR or extracted folder but its PNG cannot decode, MineWorld now tries valid older Java/Bedrock filename aliases. If an alias is selected, its own `.png.mcmeta` drives the animation; modern decodable artwork always wins. This prevents a damaged preferred file from hiding an otherwise usable historical sprite. A missing optional Bedrock flipbook parser also no longer interrupts Java animation imports.

Farmland side textures use Java's [0,1,16,16] vertical UV rectangle, while end portal frame sides use [0,3,16,16]. These crops use the lower 15 and 13 rows of the player's source texture, respectively, instead of incorrectly dropping the bottom rows. Other custom model geometry, arbitrary JSON face UVs, per-block rotations and full Java blockstates remain unsupported. All player-supplied bitmap data stays on the device.

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

## Additional Java workstation faces (6.17)

MineWorld now reserves **11 distinct directional atlas tiles** while keeping all 169 existing block IDs and 507 original top/side/bottom slots unchanged. The WebGL atlas grows from 256×512 to 256×1024 (1 MiB of uncompressed RGBA texels). Your locally supplied Java Edition ZIP/JAR can replace the separate side art for furnaces, blast furnaces, smokers, crafting tables, cartography tables, smithing tables (both MineWorld workstation IDs), fletching tables, lecterns and looms. The cartography table now uses all three Java side textures: `cartography_table_side1` on its south face, `side2` west, and `side3` north/east. Correct Java bottom sources are `dark_oak_planks` for cartography tables and `birch_planks` for fletching tables. The extra faces also support animated source sprites when a local pack provides valid PNG + `.mcmeta` metadata.

These updates do not add Java's complete block-state/rotation system or reproduce complex workstation geometry (notably the lectern). Workstations currently use fixed world-facing directions rather than storing orientation in existing world saves. Imported bitmaps stay on the player's device, and none are included in the public repository. With no imported pack, the new side slots use independent procedural fallback art. Rendering still supports Smooth or Classic Pixels mode from 6.16.

## MineWorld 6.18: default classic pixels and expanded creatures

Classic sharp pixels are again the default on desktop and mobile, including player-imported Java texture packs. The earlier Smooth-by-default setting is migrated to a new preference key (`mineworld-texture-smoothing-v2`); users can explicitly opt back into Smooth through Pause/Options and that new choice persists. The block atlas is still 16×16; no official Minecraft art is bundled.

The mob system now recognizes 57 additional species inspired by the Minecraft Wiki [mob list](https://minecraft.wiki/w/Mobs), on top of the existing MineWorld roster. New species include allay, armadillo, axolotl, bee, copper golem, frog, mooshroom, rabbit, sniffer, wolf, drowned, guardian, breeze, bogged, creaking, warden, nautilus, zombie nautilus, camel husk, parched, and others. A compact original procedural 16×16 nearest-neighbor material is created for **every** rendered mob, including existing mobs; no vanilla mob bitmaps are copied, embedded, or fetched. Expanded creatures have 3D cuboid model variations with pixel-sized accents and eyes. Habitat selectors introduce selected land species in appropriate biomes and selected extra monsters at night. Aquatic species can be summoned only in water. The Pause menu includes a Creative mob selector with a summon button (host/local worlds, not guests). Creepers now have a short warning fuse with blast radius and falloff rather than instant-touch destruction; spiders and cave spiders gain nocturnal aggression and calm behavior in daylight unless provoked.

**Limitations:** The new mobs are simplified independent implementations. They do not yet reproduce every Minecraft Java attack, taming, breeding, drops, flight, swimming, navigation, structure-specific spawning, hitbox, sound, entity texture, variant, or mob interaction. Animal and mob textures are original gray-toned 16-pixel patterns tinted by model colors, not Mojang's original skin bitmaps. Some entities from snapshots have incomplete mechanics and not all listed species spawn naturally. The compact ~26-entity active cap protects mobile performance. Neither automated tests nor this catalog claim visual or behavioral equivalence with Java Edition. Existing saves retain their formats and world identifiers.

## Player-pack precedence and animated first frames (6.19)

When an imported Java ZIP/JAR or extracted folder contains more than one copy of a sprite, MineWorld now prefers `assets/minecraft/textures/block/` over legacy `assets/minecraft/textures/blocks/`, then plain-root `textures/block/` over `textures/blocks/`. This is independent of archive entry ordering; equal-priority duplicates keep their first occurrence. Vanilla Minecraft namespace entries outrank plain-root fallback files. The rule applies to `.png.mcmeta` files too, so an older duplicate cannot override a modern animation schedule. Other mod namespaces remain excluded, and Java bitmaps are never redistributed.

Java `.png.mcmeta` animations can begin at a frame other than zero (for example, `frames: [3, 1]`). Initial atlas painting now honors the **first scheduled frame** for normal block faces, transparent grass overlays, and extra workstation sides, rather than briefly showing frame zero until the first GPU animation update. Only player-imported textures are affected: world saves, block IDs, mobile controls, and combat state are unchanged. Timing and interpolation are still approximations rather than Java renderer equivalence.


## Imported Java quarter-turn cuboids (6.57)

A player-selected Java blockstate can rotate a **single axis-aligned cuboid** by 90°, 180°, or 270° around the Y axis. MineWorld now rotates that cuboid's X/Z bounds about the block center as well as its face textures and UV orientation. This corrects off-center shapes whose artwork previously fell back instead of rendering, and keeps imported mesh and collision bounds aligned. The change does not rotate or approximate angled elements, multi-element models, X/Z blockstate rotations, or incomplete six-face models; those still use the established fallback. Imported art stays local, nearest-neighbor filtered, and subject to existing mobile GPU limits. Existing world saves and touch controls are unchanged.

### Imported liquid faces and foliage (6.59)

Local Java Edition `water_still.png` and `lava_still.png` are used on
horizontal faces, while `water_flow.png` and `lava_flow.png` supply
vertical faces. Their separate `.png.mcmeta` animations retain their
authored frame timing. Bedrock `water_flow_grey.png` and flipbooks are
recognized too. When a player imports only still artwork, the sides
reuse it instead of exposing procedural art. Imported leaf alpha is
cleared before drawing and nearest-neighbor scaling is retained;
32-pixel leaves remain native resolution when the GPU supports the
2048-pixel atlas, otherwise the 16-pixel mobile fallback is used.

No original Minecraft artwork is included or downloaded. Fluid geometry
and translucency are still simplified and are not a complete
Java/Bedrock renderer.

## 6.62 — large Bedrock terrain atlas compatibility

Player-imported Bedrock `textures/terrain_texture.json` files can contain thousands of entries. MineWorld checks up to 4,096 local texture definitions with a 1 MiB JSON size cap, including ZIP/JAR/.mcpack archives and extracted folders (the ZIP importer previously rejected metadata above 256 KiB). This preserves late water, lava, and foliage aliases from large player-owned packs. Local `textures/blocks/...png` references also resolve alongside extensionless paths. URLs, mod namespaces, and directory traversal remain rejected; no game artwork is bundled or downloaded.
