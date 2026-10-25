# MineWorld 6.31 — Bedrock Mob Skins, Item Art and Movement Recovery

**Player movement:** Added a safe blocked-position recovery when starting/resuming a world, preserving the existing world, inventory, saved block edits and entity IDs. The updated browser smoke runner verifies physical movement by WASD in desktop Chrome and touch joystick drag in emulated mobile Chrome, rather than just loading the world. This does not prove every location in an existing saved world is navigable.

**Bedrock/Java local texture packs:** The existing on-device ZIP/JAR importer now recognizes `textures/entity/<name>.png` and nested folders. It also parses Bedrock `resource_pack/entity/<species>.entity.json` descriptors to select the current `textures.default` (e.g. the official newer `pig_v3` sprite). A bounded subset of decoded 3D item sprites and available mob skins is packed into the game's existing small GPU atlas. Original mob skin colors are shown on MineWorld's independently modeled mobs; the current cuboid UV mapping samples skin regions and is **not** exact Bedrock geometric/model UV parity. Item PNGs now appear in hotbar slots and, for supported sprites, floating world drops. Dropped blocks use the active block texture atlas rather than solid procedural colors. Original Java-style inventory icons continue to load on demand, including those excluded from the bounded GPU drop atlas. Reimporting or resetting a pack removes prior imported mob skins.

**Verification:** Automated tests use synthetic PNG and ZIP files, not packaged Minecraft asset bitmaps, and cover Bedrock entity paths, renamed client entity files, item sprites, GPU resets, hotbar/world integration and movement behavior. Browser tests also verify reloaded local packs and real desktop/mobile joystick travel. The player chooses their own licensed textures and retains them privately in browser storage; the website does not fetch or bundle game content.

**Remaining work:** Full Bedrock texture UV mapping for each unique mob bone and geometry, alternate mob texture variants, modded pack namespaces, Bedrock TGA art, all Bedrock item atlas metadata, all remaining features requested across the game, and physical-device testing are not yet complete. This is a substantive upgrade, not a claim of 1:1 Bedrock or Java implementation.

---

# MineWorld 6.30 — Java-Style Entity Hitboxes and Collision

The player hitbox is now 0.6 blocks wide by 1.8 standing or 1.5 crouching, with full-width collision checks against existing block geometry. A new independent entity hitbox module defines widths/heights for over 75 named animal and monster species using published Java Edition dimensions, plus baby sizes and selected variable-size states. Mob spawn/walk checks cover their entire width and height, rather than only the central voxel. Aiming at animals, villagers and PvP players now uses ray-versus-box intersection and checks which block face actually blocks the hit. Properly aimed large animals can be struck when the edge of their box is within reach.

F3+B on desktop shows entity hitboxes; a Pause-panel toggle makes this available on mobile. These changes don't change world-save keys, block IDs, or locally imported art. No Minecraft assets or code are bundled.

**Remaining limitations:** This does not recreate every Java block collision voxel shape, multipart Ender Dragon hitboxes, all pose transitions, advanced entity collisions, or custom-model shapes. Some MineWorld-original mobs use fallback hitboxes; real-device testing and more precise Java comparisons are still needed. Dimensions reference https://minecraft.wiki/w/Hitbox.

---

# MineWorld 6.29 — Java Texture Import Recovery and Partial-Block UV Fidelity

**Import resilience:** If a preferred modern Java block PNG is present but corrupt or undecodable, the importer now tries independently named legacy/Bedrock aliases in priority order. The selected decoded sprite's own `.png.mcmeta` animation metadata is used, instead of pairing a fallback with the corrupt preferred file's metadata. Shared PNGs are decoded only once per import. A missing Bedrock flipbook helper no longer prevents otherwise valid Java `.png.mcmeta` imports. Invalid packs still fail without replacing the last working atlas. Player-provided assets remain local; no original Minecraft bitmaps were added.

**Java model UVs:** Farmland (dry/wet) and the end portal frame now sample the *bottom* 15 or 13 rows of their imported side PNGs, respectively, matching the Java model's [0,1,16,16] and [0,3,16,16] side UV rectangles. Full-width top and bottom textures, other block UVs, world IDs and save data are unchanged. This is targeted UV fidelity, not full Java model JSON/blockstate support.

**Tests:** New regression cases cover corrupt modern PNG fallback, canonical precedence, matching alias animation metadata, invalid-pack rejection, and UV rectangles. The CI suite includes browser smoke testing on desktop and emulated mobile Chrome. Physical devices and every third-party resource pack are not exhaustively tested.

---

# MineWorld 6.28 — Mining and Animal Movement Repairs

**Mining:** The block-breaking job now cancels immediately when desktop mouse input ends or mobile Mine-button touch input ends, is canceled, or loses pointer capture. It no longer continues destroying a block after the user releases the control. The block selection outline and independent fracture lines now follow the actual shape of partial blocks (such as lanterns, farmland, beds, and thin stems) instead of appearing around a floating full-size cube when imported Java/Bedrock textures are active.

**Animals:** Land animals now animate their walking legs only after they physically move, rather than when they merely attempt to move into an obstacle. Ridden and stationary tamed animals explicitly stop the walking animation. Spawn and walk checks account for an animal's full body height; this reduces clipping into low solid ceilings and above-ground walls. Both changes preserve existing creature IDs, mob data, worlds, saves, renderer materials, and touch controls.

**Tests:** New targeted regression tests cover block crack geometry, mouse/touch release, trapped-mob gait logic, vertical animal clearance, and source integration. The GitHub Actions suite includes desktop and emulated mobile Chrome smoke testing, but real player-supplied texture ZIPs and physical-device edge cases are still not exhaustively verified. No Minecraft original bitmaps are bundled; imported textures remain on the player's device.

---

# MineWorld 6.27 — Safer Resource-Pack Replacement and Cleaner Options Menu

MineWorld now **keeps the previously working local texture atlas, biome palette and imported sounds when a replacement pack contains no usable block, item or sound assets**. Earlier builds could clear sounds before validating a new resource pack. A successful replacement now retains newly decoded sound types and removes stale imported samples without wiping the new ones. The Options menu no longer shows duplicate resource-pack import panels; this is especially useful on small mobile screens. Existing worlds, block IDs, inventories, and player-owned asset files are unchanged. Added a regression test covering invalid import recovery, preserved sounds/texture state, and the Options panel count; prior biome-tint tests now verify that candidate palettes are used before committing the new pack.

**Verification:** The GitHub Actions Node regression suite and desktop/mobile browser smoke workflow passed on the pre-release fixes. The updated release/cache labels have been pushed for a fresh deployment. Actual Java Edition JARs, original entity skins, many orientation-dependent block states, and real-device rendering are not yet exhaustively verified. This update is not feature completion or a claim of 1:1 Minecraft fidelity.

---

# MineWorld 6.25 — Bedrock Animated Tiles and Fixed Face Orientation

The game now recognizes **Bedrock flipbook animation metadata** from a player-selected Mojang resource pack, including the official full `bedrock-samples` ZIP. It reads `resource_pack/textures/flipbook_textures.json` (or `textures/flipbook_textures.json` in extracted or smaller packs), matches available PNGs to MineWorld's existing block atlas, and plays supported animations using Bedrock's 20-ticks-per-second timing, frame order, and per-texture blend choice. Supported imported animated faces are drawn frame-by-frame into the existing local 16×16 GPU atlas; unaffected faces keep their original procedural motion. The diagnostic importer now reports how many Bedrock animations it actually matched. Java's `.png.mcmeta` animations remain supported and take precedence when both formats are present.

**Side texture fix:** World-mesh UVs now orient each surface according to its outward normal. This keeps the top of north/south/east/west side graphics upright instead of flipping them, and gives up/down faces a consistent north-facing reference. Directional workstation face selection from earlier releases stays intact. No block IDs, saved-world data, or purchased assets were changed.

**Use:** In MineWorld, choose **Use original Bedrock textures**, select your personally downloaded Mojang ZIP, and allow it to be remembered privately if desired. Existing remembered packs will automatically gain animation support when they load under 6.25.

**Limitations:** This update covers animation definitions that match MineWorld's current 169 block IDs / available atlas faces, **not every Bedrock feature**. Entity bone animation controllers, particles, weather, held-item states, block-state rotations, 3D animations and models require separate compatible renderers. The importer never copies licensed Mojang images into MineWorld's public repository. The real 169 MB Mojang ZIP and physical-phone appearance have not been fully manually smoke-tested; browser tests use synthetic PNGs/ZIPs.

---

# MineWorld 6.24 — Verified Bedrock Face-Mapping Expansion

This release improves **24 Bedrock Samples sprite filename aliases** verified against the official Mojang `resource_pack/textures/blocks/` file listing. These include oak/spruce/birch/acacia/jungle/mangrove/pale-oak leaves, grass sides, bamboo, rose bushes, dripstone, crimson and warped nylium, crimson stems, twisting vines, End portal frames, shulker tops, fletching tables, and bed faces. Java Edition canonical names still take precedence; legacy alternatives are retained. The new `tests/bedrock-sample-aliases.test.cjs` checks the mappings and their priority.

**To use the original textures:** download Mojang's ZIP below, then select **Use original Bedrock textures** on MineWorld's main menu. The chosen pack is applied to mapped blocks and items; the browser attempts to remember it privately on that device. If storage is unavailable, choose the ZIP again on the next visit. No original Mojang bitmap is checked into this public repository. Some MineWorld faces and all non-compatible entity models will still use original independent art.

---

# MineWorld 6.23 — Official Mojang Bedrock Textures ZIP (No Repackaging)

**Get Mojang's own complete Bedrock texture files:** [Download bedrock-samples-v1.26.50.4-full.zip](https://github.com/Mojang/bedrock-samples/releases/download/v1.26.50.4/bedrock-samples-v1.26.50.4-full.zip) (169,385,576 bytes, ~169 MB). This is an official Mojang GitHub release, distributed under Minecraft's EULA rather than bundled or rehosted by MineWorld.

In MineWorld, open **Options → Custom resource pack**, tap the official download link, save the ZIP to Files, and then select that downloaded ZIP in the picker. MineWorld can now read block, item, and supported sound files directly from the nested `resource_pack/textures/blocks/`, `resource_pack/textures/items/`, and `resource_pack/sounds/` directories in Mojang's full samples archive. Older `textures/blocks` roots, modern Java `assets/minecraft/textures/block`, extracted PNG folders and Bedrock `.mcpack` files remain supported. The player-selected ZIP is read privately in their browser; the game itself never fetches or hosts Mojang art. Up to 240 MiB of ZIP data is accepted; larger archives can consume significant memory on mobile and may require a desktop browser. Remembering a pack on the device is an optional local IndexedDB action.

**Compatibility:** This is not an automatic complete pixel-perfect clone. The texture importer supports the existing 169 MineWorld block IDs, selected directional faces and mapped inventory sprites. Unmatched Minecraft textures retain independent MineWorld artwork, and entity skin images need compatible entity geometry and UV mapping to render faithfully. Mojang's file is provided directly by Mojang; the Minecraft EULA governs its use.

---

# MineWorld 6.22 — Bedrock Resource Packs from Your Phone

MineWorld now accepts **Bedrock .mcpack** resources from a phone's Files picker, in addition to Java ZIP/JAR archives. Open Options → Custom resource pack or Inventory → Import textures and choose a .mcpack or .zip that you have in Files. Compatible packs may contain textures/blocks/*.png and textures/items/*.png; the importer matches existing block faces and item sprites, with common Bedrock filename aliases. Matched artwork uses the exact pixels from the player-selected PNG; unmatched graphics keep MineWorld's independent fallback. Optional Remember saves the chosen pack in this browser only.

**iPhone limitation:** A Minecraft installation on the same phone cannot be read by this website. The installed game's built-in texture files are generally not exposed to the iPhone Files picker. You must have a separately accessible resource-pack file to select; an installed Minecraft app alone is not a transferable resource pack. MineWorld does not open Minecraft's app sandbox, its purchase data, or the app package (.ipa); similarly, it does not import Android .apk installation packages. No original Minecraft bitmaps are downloaded, bundled, or published in this repository.

Bedrock naming and entity models differ from Java Edition. Some texture names will remain unmatched and mob skins need separate mesh/UV work before they can look identical. See Microsoft's resource-pack format guide: https://learn.microsoft.com/en-us/minecraft/creator/documents/comprehensivepackcontents?view=minecraft-bedrock-stable

---
# MineWorld 6.21 — Import Actual Java Edition Item and Block PNGs

**Play:** https://rdcoleuh.github.io/My-Project/

This release expands **direct player-owned asset import**: select your own Minecraft Java Edition resource ZIP or version/client JAR using the game's **Options → Custom Java resource pack** or **Import Java textures** controls. The ZIP/JAR must include `assets/minecraft/textures/block/*.png` and/or `assets/minecraft/textures/item/*.png`. MineWorld now reads **both** kinds of real PNG sprites. Block art is drawn onto the corresponding atlas faces, and item icons are loaded lazily from the exact `textures/item` PNGs into the Java-style inventory instead of fallback emoji. Missing images retain MineWorld's independently drawn originals. Modern vanilla paths take precedence over old duplicates; non-`minecraft` namespaces cannot overwrite vanilla icons.

On Windows, the client JAR is normally in `%APPDATA%\\.minecraft\\versions\\<version>\\<version>.jar`; on macOS, `~/Library/Application Support/minecraft/versions/<version>/<version>.jar`; on Linux, `~/.minecraft/versions/<version>/<version>.jar`. You may also select a compatible ZIP or extracted texture folder. **No original Mojang bitmap is embedded in, downloaded by, or committed to this public GitHub Pages repository.** Selected files remain on the player's device, and "Remember this ZIP/JAR" is optional. Reset releases imported item icons, sounds, block art, and any privately remembered ZIP.

The Creative/Survival inventories also fix block sprite atlas alignment after the atlas grew from 32 to 64 rows, so existing imported block previews no longer look displaced. **Limitation:** Exact entity skins require per-part Java model geometry and UV mapping, which are not implemented; the current procedural mob materials are still independent approximations. Original inventory item art may also depend on item state, tint, model layers, and version-specific components that MineWorld does not yet reproduce. This is direct PNG use, **not** a claim of complete Java gameplay or rendering parity.

---

# MineWorld 6.15 — Keep Your Java Textures Between Visits

**Play:** https://rdcoleuh.github.io/My-Project/

The Java Edition ZIP/JAR importer now has an explicit **Remember this ZIP/JAR on this device** option. When selected, the player's own archive is stored privately in browser IndexedDB and automatically restored on future visits, including animated water, lava, and other matched block textures. The option is off by default; reset deletes the saved archive. This does not distribute Mojang art, change world saves, or require an account or server upload.

The preceding directional-texture update also separated furnace, blast furnace, smoker, crafting table, and cartography table side artwork from their front artwork using spare atlas slots. Imported files provide the exact pixels; unmatched blocks still use original MineWorld art. Exact Java geometry/model/block-state fidelity is not yet complete. See RESOURCE-PACKS.md for importing and limitations.

---

# MineWorld 6.12 — Java resource-pack animation grids

**Play:** https://rdcoleuh.github.io/My-Project/

Player-supplied Java Edition resource packs now support animated PNG sprite sheets with explicit `animation.width` and `animation.height` in matching `.png.mcmeta` files. Frames can be arranged horizontally or across multiple rows, in addition to traditional vertical strips. MineWorld selects frames in row-major order, respects the existing 20-tick-per-second timing, custom frame sequences and interpolation flags, and uploads only changed 16×16 atlas tiles. Missing original sprites still fall back to independently authored MineWorld artwork. No Mojang bitmaps or source code are included.

Regression tests cover the actual importer and GPU upload path for a 4-column by 2-row animated sheet, older vertical strips, the untouched save keys, and mobile/offline loading. The full suite runs on GitHub Actions; physical-device visual verification remains outstanding.

---

# MineWorld 6.7 — Refined Voxel Textures + Smarter Java-Style Inventory

**Play:** https://rdcoleuh.github.io/My-Project/

MineWorld 6.7 updates **the actual browser game** with a more distinctive final 16×16 procedural pixel-art pass. Dirt and grass edges, smooth stone, irregular cobblestone, board-grain planks, angular ore clusters, furnace faces, tree end-grain, carved crafting tables, chests, cactus, hay and stone/Nether/End masonry are more carefully defined. Existing painter layers still supply block categories not targeted by this pass.

The inventory is improved beyond 6.6: a pixel character preview; visually cleaner armor/offhand/crafting layout; double-click matching-stack collection to 64; cursor stack spreading across multiple slots; clearer mouse and touch split/one-item controls; Shift-click armor equipping; Q/Ctrl+Q dropping while in inventory; and a categorized, paged Creative inventory with a visible selected hotbar position. **The 27 main slots, 9 hotbar slots, 64 stack caps, overflow pages, slot IDs, offline support and saved worlds remain supported.**

**Local Java textures:** Use the inventory's `Import Java textures` option to select a compatible Java Edition ZIP or JAR **you provide**. Its block PNGs remain in memory locally. Neutral grayscale grass and leaf sprites now receive a plains/foliage color tint (as occurs in Java rendering), while custom already-colored files are preserved. Imported sprites preview in the inventory and hotbar. Unmapped or missing faces keep original MineWorld graphics.

The built-in default art is independently illustrated, **not** a pixel-for-pixel copy of Minecraft; using a compatible local pack is still needed for the actual original game artwork. No copyrighted block texture bitmaps are bundled in the public repository.

**Verification:** GitHub Actions runs the full Node regression suite, now including test coverage for 169 blocks, cropped transparency, deterministic texture faces, inventory item conservation, splitting/collection/distribution, older save migration and vanilla-style local sprite tinting.

---

# MineWorld 6.6 — Java-style Slot Inventory and Local Java Texture Packs

**Play:** https://rdcoleuh.github.io/My-Project/

Version 6.6 replaces the old scrolling Survival backpack with a persistent Java-style layout: **27 main inventory slots, nine separate hotbar slots, armor positions, an offhand slot, a held cursor stack and safe overflow pages** for older saves with unusually large inventories. The existing functional 2×2 crafting grid is integrated beside armor in the inventory panel, and larger crafting stations and recipe menus still work.

- **Move and split:** Left click/tap pick up and place a stack; right click/contextmenu splits a stack in half or places one item; Shift+click moves a stack between inventory and hotbar; drag/drop swaps or merges stacks; hover + number key 1–9 swaps with a hotbar slot.
- **Offhand:** Press F in Survival (or click the offhand button beside the hotbar) to swap the selected hotbar item with the offhand. F still toggles flight in Creative.
- **Creative:** E and the inventory button open a searchable **169-block** selection instead of merely cycling predetermined hotbar pages.
- **Save compatibility:** Legacy stack IDs, world slots, block IDs, total item counts and save schema version 13 are preserved. The new optional \`javaInventory\` field retains exact slot locations across save/load without discarding existing items. Existing inventory counters remain authoritative for crafting/gameplay.
- **Textures:** The original procedural 16×16 textures remain as the default fallback. A new **Import Java textures** action inside the inventory allows you to choose your own Java Edition resource-pack ZIP/JAR. Compatible original textures are applied **locally in your browser**, never sent to or bundled in this public repository, and the inventory previews show imported block faces. Unsupported/missing sprite names retain MineWorld art.

This inventory is modeled after Java Edition's familiar layout and core slot manipulation, but it does not reproduce every vanilla menu, keybinding or gameplay mechanic.

**Verification:** GitHub Actions tests cover stack splitting, conservation of item totals, shift-transfer, number-key swaps, offhand, overflow migration, save wiring, asset caching, and the existing gameplay/texture regressions.

---

# MineWorld 6.5 — Stronger Classic Block Silhouettes

**Play:** https://rdcoleuh.github.io/My-Project/

This release goes beyond 6.4's small pixel highlights. A new, locally generated `texture-classic-forms.js` layer **redraws more than 60 iconic block variants**, with deliberately arranged original 16×16 shapes and distinct faces. The rest of the 169-block catalog keeps its existing 6.4 detail stack.

- **Terrain:** More legible green grass blades and dirt side, clustered natural stone, variegated sand, irregular gravel and cobblestone fieldstones.
- **Building:** Tighter horizontal plank grain, clear staggered mortar lines for clay/stone/Nether/End bricks, and layered sandstone.
- **Trees:** Species-specific bark and tree-ring patterns, bright birch scars, clumpy foliage colors and preserved leaf cutouts.
- **Minerals:** Chunky, angular mineral inclusions in separate stone and deepslate hosts for coal, iron, copper, gold, redstone, lapis, diamond and emerald.
- **Special materials:** Clear glass reflections, deeper obsidian, distinct Nether rock patterns and pitted End stone.

No proprietary Minecraft/Eaglercraft texture files are copied. This is standalone original artwork inspired by the recognizable block categories. Players with their own compatible Java resource pack can use the existing in-browser custom resource-pack importer for actual licensed/personal texture assets.

**Compatibility:** Block IDs, world data and save keys, the original resource-pack importer, crafting and workstation imagery, movement, animation and gameplay modules are not migrated or replaced. Existing worlds should continue loading. The full **76-test GitHub Actions regression suite passed**, including new checks for all 169 materials and top/side/bottom faces, crop transparency, distinct rock-host ores, save wiring, mobile/offline precaching and unique block-side signatures. GitHub Pages deployed successfully.

---

# MineWorld 6.4 — 169-Block Pixel Microdetail Pass

**Play:** https://rdcoleuh.github.io/My-Project/

This release adds an independent procedural `texture-facets.js` painter after the existing core-art layer. All **169 block IDs**, on **top, side and bottom 16×16 faces**, receive deterministic, nearest-neighbor-friendly microdetail while retaining their unique material patterns.

- **Bark and leaves:** Vertical bark scoring, cut-end ring shading, species-specific foliage clusters and cherry highlights.
- **Ores and stones:** Mineral facet edges, subtle rock flecks and clearer earthy/rocky material contrasts without flattening existing ore veins.
- **Glass, ice, obsidian, cactus, bamboo and hay:** More recognizable reflection, fracture, dark-violet vein, rind/spine, cane joint and straw/binding details.
- **Metal, brick, wood, Nether, glow blocks, crops and workstations:** Family-aware chipped edges and limited contrast changes that preserve established silhouettes, device faces, crop transparency and fluid animations.

No world-save formats or block identities were changed, and no Minecraft/Eaglercraft artwork was copied. Existing custom resource-pack support remains available for owners of compatible resources.

**Automated verification:** All **72 regression tests passed** on GitHub Actions. The new tests compare before/after texels for every block, verify alpha and cutouts, distinct side materials, 16×16 dimensions, face-specific geometry, script order, and offline precaching. GitHub Pages deployment completed successfully.

---

# MineWorld 6.3 — Cleaner Classic-Style Terrain & Building Blocks

**Play:** https://rdcoleuh.github.io/My-Project/

This is another **direct game-texture update**, not a mockup. All designs are independently authored, with **exactly 16×16 source texels per face** and nearest-neighbor rendering; no Minecraft texture bitmaps, copied pixel maps, or Eaglercraft packages are distributed.

- **Grass:** Separately illustrated green top, stepped grassy side edge, dirt underside, and overhanging blades; existing biome-aware grass tint remains.
- **Dirt, coarse dirt, sand, red sand and gravel:** More readable clustered earth and small pebbles instead of uncontrolled noise.
- **Smooth stone and cobblestone:** Smoother stone palette with scattered chips; cobblestone now uses a distinctive irregular mortar-and-rock silhouette rather than repeated uniform bricks.
- **Wooden planks, clay bricks and stone bricks:** Horizontal plank seams, knots, staggered masonry courses and shaded material edges.
- **Sandstone, podzol and farmland:** More distinctive top/side/bottom texture behavior; dry versus irrigated soil are visibly different.
- **The 6.2 refinements stay intact:** improved logs, leaves, ore clusters, Nether, End and workstation details, plus transparent crop growth sprites.

Existing world IDs, game inventory, controls, skin customization and multiplayer are unchanged. The updated service worker refreshes the offline block atlas.

**Verification:** The full automated regression suite passes, including a new 16px core-material test that checks grass/dirt separation, stone and cobblestone differences, recognizable plank/brick seams, hydration colors and save compatibility. The tests cover all **169 block IDs** and their three texture faces, but final appearance can still vary with browser/device rendering.

For the **actual pixels from your own compatible Java Edition resource pack**, open **Options → Custom Java resource pack** and select an eligible ZIP/JAR file. This browser-local option does not upload your texture files or add them to the public repository.

---

# MineWorld 6.2 — Texture Fidelity Pass

**Play:** https://rdcoleuh.github.io/My-Project/

This update continues refining the game's **independently generated, Minecraft-style 16×16 block art**, not just the title screen.

- **Logs:** Separate cut-end rings and vertical bark for oak, spruce, birch, jungle, acacia, mangrove, cherry, pale oak, and Nether stems. Bark now has clearer pixel-by-pixel grain.
- **Leaves:** More natural species-specific colors, layered clusters, and tiny transparent holes, with sharper nearest-neighbor pixels.
- **Minerals:** Distinct embedded coal, iron, copper, gold, redstone, lapis, diamond, and emerald clusters across normal-stone and deepslate ores.
- **Other blocks:** More distinctive sediment, blackstone, basalt, netherrack, magma, nylium, End stone, end bricks, purpur, mineral storage blocks and structural details. Existing 6.1 workstation icons and face-specific designs remain in place.
- **Crops:** Wheat, carrots, potatoes, and beetroots now use transparent sprite cutouts with visibly different growth stages, instead of solid earthy squares.
- **Existing custom packs:** **Options → Custom Java resource pack** now exposes local ZIP/JAR importing alongside the existing in-world options. The importer recognizes more old Java resource-pack log and leaf filenames. For a pixel-for-pixel match, import eligible resource textures from files you have the right to use; your assets stay local and are not uploaded into the public GitHub project.

**Testing:** Automated tests check every pixel of all 169 block IDs on all three material faces, distinct block patterns, full source pixel resolution, bark/leaf details, crop transparency, and preexisting gameplay. Browser/phone rendering still needs hands-on checking. The update does not change world-save IDs, inventory, controls, or save data.

The public repo **does not include Mojang/Eaglercraft texture files**. Minecraft is a trademark of its respective owners; MineWorld is an independently developed project.

---

# MineWorld 6.1 — Much More Recognizable 16×16 Block Artwork

**Play:** https://rdcoleuh.github.io/My-Project/

This update specifically targets texture resemblance and readability. All tiles retain their **16×16 source-pixel scale** and sharp nearest-neighbor sampling. The work replaces random-looking color noise with original, hand-authored material motifs: logs now have vertical bark and distinct ringed ends, birch bark shows dark horizontal flecks, cherry wood and leaves are pink, spruce is dark and needle-like, and each other tree species has its own palette. Coal, iron, copper, gold, redstone, lapis, diamond and emerald ores have recognizable angular embedded clusters, including eight deepslate versions with darker hosts.

Other refreshed families include cobblestone, stone, deepslate, Nether basalt and blackstone, staggered stone and Nether masonry, mineral storage blocks, colored End materials, nylium, magma and glowstone. I also redrew directional panels for chests, furnaces, smokers, blast furnaces, crafting tables, barrels, cartography/loom/fletching/smithing workstations, lecterns, stonecutters, grindstones, brewing stands, cauldrons and composters. Materials not explicitly repainted continue to use the earlier MineWorld art; **all 169 block IDs still render**.

None of these images are copied, downloaded, or extracted from Minecraft or Eaglercraft. The style is informed by familiar 16px voxel-art conventions, but the pixel arrangements remain independent. To view original Minecraft textures pixel-for-pixel in a private browser session, MineWorld separately supports player-selected, compatible local Java resource-pack ZIPs in the home and Pause menus. You must supply a pack you're authorized to use; imports are not included in the public repository and do not persist after refresh.

**Regression tests:** samples every pixel on every face of all 169 blocks, validates RGBA/texture uniqueness, and checks distinct log endgrain, mineral contrast, foliage, utility fronts and offline caching. Existing worlds, inventories, player skins, advancements and multiplayer are unchanged.

---

# MineWorld 6.0 — Animal Models, Natural Textures & Gameplay Fixes

**Play:** https://rdcoleuh.github.io/My-Project/

This release continues the independent Minecraft-style sandbox project with improvements based on the [Minecraft Wiki's animal reference](https://minecraft.wiki/w/Animal) and [16×16 source texture conventions](https://minecraft.wiki/w/Textures). All visual textures, cuboid animal models and source code are drawn and authored independently; no Eaglercraft/Mojang image or sound files are embedded.

### Improved animals

- More recognizable individual **cow, pig, sheep, chicken, horse, donkey, mule, camel, llama, skeleton horse and zombie horse** models. Each has separate proportions, facial features, ears, legs, bodies, and a simple animated gait rather than the same generic cuboid.
- Common passive wildlife now spawns according to nearby biomes instead of choosing uniformly from all rideable species. Rare skeleton and zombie horses no longer appear as ordinary farm livestock.
- Ordinary animals flee temporarily after being struck, follow players holding supported breeding food, and wander when they have no target.
- **Feed two nearby adults** using their valid food item and right-click (or Place with an animal targeted) to create a baby, where the breeding items exist in MineWorld. Baby animals grow over roughly 20 in-game minutes and breeding has a cooldown. Cows and sheep like wheat, pigs like carrots/potatoes/beetroot, chickens like seeds, camels use cactus blocks, and llamas use hay bales.
- **Shear sheep** using shears in your hotbar and right-clicking a sheep; sheared models lose their wool and regrow it after grazing on grass.
- Farm animals and their baby/sheared status are saved with their original world in the browser. In shared multiplayer, the host can interact with animals; animal changes are included in the updated mob snapshots.

**Limits:** This is not a full Minecraft entity simulator. The currently implemented MineWorld species are improved, but all possible vanilla animal mobs, special behaviors, and animations are not present. There is no direct copying of Minecraft skins or geometry.

### Sharper original block textures

- Added a 16×16 pixel detail layer for grass tops/sides, dirt, rock, sand, red brick, planks, furnace, cobblestone, gravel, farmland, crafting table and bed.
- Texture resolution remains consistent: one source texel per 1/16th block, with nearest-neighbor sampling and distinct block faces. All **169 existing MineWorld block IDs** are retained.
- The previous handcrafted ore patterns, trees, biome features, skin editor and optional local resource-pack ZIP importer continue working.

### Reliability and tests

- Preserves your existing world saves, individual Creative/Survival save slots, player skins, 126-title advancement journal, item-stack counts, chat and other prior gameplay.
- Resolved outdated version assertions in the regression suite and added dedicated checks for unique 16×16 textures, animal size bounds, biome spawning, breeding, feeding and persistence. Animal snapshots now also carry heading, baby and sheared state across multiplayer.
- As before, browser-world saves are stored locally on your device. Export backups when possible and avoid clearing site data.

---

# MineWorld 5.8 — Live Player Chat & Block Stacking

**Play:** https://rdcoleuh.github.io/My-Project/

### Chat with other players

- Connect through **Multiplayer / Friends** on the main menu or in Pause. Host a private room and share its invite link, join a friend's room, or join an available public session.
- While playing in a connected room, press **T** or **Enter**, or tap the **💬 Chat** button on desktop/mobile. Type and press **Enter** or **Send** to send the message to everybody connected to that same room.
- Chat can be collapsed using **Hide** or Escape; a small unread count appears when new messages arrive. Press **T** or tap **Open** to view the conversation. The text field no longer triggers movement controls while you type.
- Player names come from the name entered before hosting/joining. The host relays chat messages to all players in that room and applies length and anti-spam limits. Chat never inserts remote messages as HTML. **Room chat is temporary, not saved or moderated**, and disappears when the session ends. No offline/local chat room is created.
- Public sessions remain browser-hosted and can disconnect or end when the host leaves; they aren't dedicated servers.

### Build upward and stack 64-item inventory piles

- Aim your crosshair at a placed block, select the new block in your hotbar, then press **B** or tap **▤ Stack ↑**. The game attempts to place the new block directly **one grid cell above** the targeted one, regardless of which side of that block you are looking at.
- Normal right-click or **Place** still works for placing adjacent to the targeted face. The vertical action will explain if the cell above is occupied, outside the world, or overlapping your character. Move out of the target space if necessary; blocks cannot be built inside the player's collision box.
- In Survival, placed blocks still consume **one item** from the selected stack. The existing inventory continues to combine matching blocks into piles of **64**, then creates another stack for overflow. Creative builds don't consume inventory.
- All existing world save IDs, separate Creative and Survival worlds, 64×64 skin editor, texture and sound import, and the multiplayer world-edit protocol remain.

### Verification

Regression tests cover upward/face placement, ceiling/occupied-cell checks, 64/64/overflow item stacks, message sanitization and rate limits, and a mocked host-and-guest PeerJS connection that exchanges messages both ways. Browser/device-specific behavior and real-world WebRTC connections still need live user testing.

---

# MineWorld 5.7 — Original Audio, Local Resource Packs & Reliability

**Play the game:** https://rdcoleuh.github.io/My-Project/

This release adds original synthesized sounds and a **local resource ZIP importer** for optional PNG block textures and OGG sound files selected by the player on their own device. No Eaglercraft or Minecraft audio or art is bundled or fetched. The importer is available from the home screen and Pause menu; its imported replacements are session-only, and its ZIP asset inputs never leave your browser. See [RESOURCE-PACKS.md](RESOURCE-PACKS.md) for supported formats, setup, asset rights, and limitations.

**Bug fixes and audits:** more robust ZIP size handling, correct migration into protected Original Creative/Survival slots, Block Guide previews of locally imported textures, preservation of imported animated tiles, plus a whole-repository JavaScript syntax and UI-identifier audit. Sound volume and mute controls are in Pause. Automated tests run via GitHub Actions, but no automated suite can rule out every possible bug.

The 16×16 original texture grid, 64×64 skin editor, multiple saved world slots, hunger, crafting, mobs, sprint, crouch, and three camera views remain.

---

# MineWorld 5.6 — Square Pixels, Custom Skins & Multiple Saved Worlds

**Play:** https://rdcoleuh.github.io/My-Project/

### New in MineWorld 5.6

- **Uniform pixel scale**: source block faces still use original 16×16 procedural textures, with WebGL nearest-neighbor filtering. Cropped/partial block faces now display the correctly sized portion of the texture (one texel per 1/16 of a block) instead of squeezing all 16 pixels across a short face. No Minecraft image files are included.
- **Player Skin Studio**: tap **Customize Player Skin** on the home screen or **Edit Player Skin** in Pause. Paint the front, back, sides, tops and bottoms of six body parts using square pixels on an original, editable 64×64 skin sheet. Select colors, use your finger or mouse, import a 64×64 PNG you own, export PNG, reset, and **Save skin**. Third-person (F5 or View button) displays your actual painted player skin via a nearest-neighbor GPU texture.
- **Multiple world saves**: tap **My Worlds** on the home screen or **Save Slots & My Worlds** from Pause. Create, name, switch between, duplicate, rename and delete additional Creative or Survival worlds. Each keeps separate terrain edits, seed, inventory, hotbar and progression. Maximum **20 slots per mode**.
- **Existing worlds are safe**: old save keys `mineworld-selfhost-v1-slot-creative-v1` and `mineworld-selfhost-v1-slot-survival-v1` are preserved as protected "Original Creative" and "Original Survival" worlds, not overwritten or migrated. New world metadata uses `mineworld-world-library-v1`. The skin is shared across worlds using `mineworld-avatar-skin-v1`.
- **Offline**: `sw.js` precaches the new skin editor and world manager; refresh the page after this release.

### Important

All worlds and the custom skin are saved **locally in this browser and device**, not synced to an account. Different browsers/devices have separate saves; clearing site data, using private browsing, or running out of browser storage can lose them. Keep an exported PNG backup of your customized skin. Duplicating worlds consumes more browser storage. The original game is an independent voxel sandbox with independently drawn materials, not Minecraft Java Edition itself.

Automated tests cover 64×64 skin pixel painting and persistence, GPU pixelated sampling, and independent multiple-world saves including legacy world protection. Run `node --test tests/*.test.cjs` from a repository checkout.

---

# MineWorld 5.5 — Original Classic Sandbox Gameplay Update

**Play:** https://rdcoleuh.github.io/My-Project/

The live 5.5 update adds familiar voxel-sandbox controls and world interactions while maintaining MineWorld's own materials, artwork and branding.

### New controls

- **Middle mouse / P / ▣ Pick:** Pick the block under the crosshair. Creative selects it from existing hotbar slots or replaces the current slot without leaving the game. Survival may equip only a real matching stack already owned; picking never grants free Survival inventory.
- **Q:** Toss one currently equipped Survival item into the world. **Ctrl+Q** drops that hotbar stack; **H** now performs the previous quick-eat action. E remains backpack/inventory. Dropping from the Survival backpack now spawns a recoverable world item rather than deleting it.
- **F3:** Show/hide in-game debug information (FPS, XYZ, chunk, compass direction, biome, seed, mode, health, food and targets). Touch players can toggle this from Pause.
- **F5 / ◉ View:** Cycle first-person, third-person behind and front-facing. The third-person camera shifts closer to the player near walls, and all mining/attacking continues to target from the character's eye position rather than the camera.
- **Mining:** Extra procedurally drawn 3D fracture lines build up over blocks as the timed break progresses.
- **Dropped items:** Original-color miniature spinning block cubes hover on the ground, with short pickup delay, gravity, automatic nearby pickup and a five-minute lifetime. Solo-world drops persist through local saves and restores. Multiplayer item tossing is disabled because drops are not server-synchronized.

The original MineWorld traveler avatar wears a teal coat, warm-orange gloves and slate boots, distinct from any proprietary player skin. The original classic 16×16 textures from 5.4, 169-block guide, 64-item stacks, hunger/XP, existing mobs, dimensions, sprint and crouch, and adaptive 10–50 visible chunks remain.

### Testing and limits

All additions use independently authored code, geometry and procedural artwork. Familiar input conventions and gameplay mechanics were researched against the [Minecraft Wiki controls](https://minecraft.wiki/w/Controls) and [breaking mechanics](https://minecraft.wiki/w/Breaking), but this game does not use Minecraft's code, sounds, textures, skins, branding, or recipe registry. It is not an exact Java Edition recreation.

The saved world still uses the `mineworld-selfhost-v1` keys, and its old inventory fields continue to load without a conversion. Optional `droppedItems` and `cameraMode` fields are backward-compatible. Existing game fields, tools and modes were retained. Run tests with `node --test tests/*.test.cjs`.

---

# MineWorld 5.4 — Classic-Inspired Original Pixel Textures

**Play:** https://rdcoleuh.github.io/My-Project/

MineWorld is an independent browser voxel sandbox for desktop and iPhone. Version 5.4 is published on the existing GitHub Pages branch and preserves the 5.3 world saves, inventory format and gameplay.

### What's new in 5.4

- The new **classic-materials.js** layer replaces procedural pixels with more material-specific, 16×16, original artwork for grass tops and grassy dirt sides, natural dirt, cave stone, sand, gravel, logs and cut wood, different leaf species, masonry, colored ores, polished mineral blocks, glass, snow, ice, cactus and nether terrain.
- **91 block IDs** show changed sample pixels from 5.3 in the tested comparison; all **169 block IDs still have different side textures**.
- Faces reflect their material: logs show end-grain rings on their top/bottom and bark on their sides, grass has a grassy top and root soil underneath, ores remain clearly distinguishable.
- Earlier block faces and decorative patterns remain in the game where they were already distinct.
- All textures are **independently generated art**, not copied Mojang PNGs or one-pixel changes. Style research used Minecraft Wiki descriptions of block texture categories and common 16×16 source-pixel resolution: https://minecraft.wiki/w/Textures and https://minecraft.wiki/w/List_of_block_textures.
- The 5.3 block encyclopedia, animated fluids, desktop/mobile controls, and 10–50 adaptive visible chunks remain intact.
- No change to serialized world seeds, inventories, 64-stacks, localStorage keys or survival mode. Reload the browser to refresh the service-worker cache.

Run automated checks locally with `node --test tests/*.test.cjs`; GitHub Actions also runs this suite after code changes.

---

# MineWorld 5.3 — Original Texture Workshop, Animated Blocks & Block Guide

**Play:** https://rdcoleuh.github.io/My-Project/

MineWorld is an independent voxel sandbox for iPhone and desktop. This version continues the existing Creative/Survival game without resetting save keys, world seeds, stack inventories, or multiplayer.

### New in 5.3

- **All 169 placeable block IDs** have distinct original side textures. Independently designed details improve ores, host rocks, crafting stations, trees, hay, End stone, purple End materials, soil, and stone.
- **Searchable Block Guide** in the Pause menu and main Options screen: block name/ID, original top and side pixels, and current rendered model sizes in 16-pixel units. Crop sizes reflect growth stage.
- **Animated original textures:** tiny GPU atlas tile updates animate water, lava, magma, and portal effects; stronger devices animate prismarine, sculk, sea lantern, and End portal surfaces. Slow phones automatically reduce work.
- **Performance:** preserves existing adaptive 10–50 **total visible chunk** slider and chunk-streaming optimizations. 50 is not a 50-chunk radius.
- **Compatibility:** preserves existing browser storage keys, 64-item survival stacks, hotbar assignments, saves, seeds, and touch/desktop sprint and sneak controls.
- **Offline:** the service worker precaches new guide and texture modules.
- **Regression tests:** run node --test tests/*.test.cjs to check colors, dimensions, animation bounds, chunk planning and inventory restoration.

### Original-art policy and research

The research starting points were the [Minecraft Wiki Block page](https://minecraft.wiki/w/Block), [List of block textures](https://minecraft.wiki/w/List_of_block_textures), [Textures](https://minecraft.wiki/w/Textures), [Solid block model sizes](https://minecraft.wiki/w/Solid_block), [Hitbox](https://minecraft.wiki/w/Hitbox), [Farmland](https://minecraft.wiki/w/Farmland), and [Soul Sand](https://minecraft.wiki/w/Soul_Sand). Most block faces use a 16×16 source-pixel grid; typical full cubes are 16×16×16 units. Partial blocks need custom dimensions, and animated materials vary over time. No Minecraft asset files were copied, downloaded, or modified by one pixel; all MineWorld art is independently generated.

**Scope:** The Block Guide covers all **169 blocks implemented in MineWorld**, not every block in the official Minecraft registry. Some models remain simplified (for example a one-block bed and box-based vegetation), and visuals/collision are not perfectly equivalent to every official model. The guide shows MineWorld's rendered dimensions, not a guarantee of exact Mojang hitboxes. Saves are local to the browser; clearing site data may erase them.

---

# MineWorld 5.1 — Survival Beds, Weather, Experience & Original Pixel Blocks

**Play:** https://rdcoleuh.github.io/My-Project/

MineWorld is an original block-based Survival and Creative browser game, not the proprietary Minecraft Java or Bedrock game. It runs on desktop, iPhone and iPad; peer-to-peer public multiplayer remains experimental.

## Crafting

In **Survival**, open the Backpack / Gear panel. You start with a **2×2 crafting grid**. Select an item in the backpack or the "Holding" dropdown, then tap a crafting square to add that ingredient; tap it again to clear, or Shift+tap on desktop to add another unit to that cell. The output button only crafts a matching, affordable recipe. A recipe search below the grid can lay out ingredients as an optional guide without automatically consuming them.

Craft a **Crafting Table** with a 2×2 square of 4 planks, then tap **Place Crafting Table**. Being within approximately four blocks of a placed table unlocks the **3×3 grid**. Aim at the table and tap Mine/Interact to reopen the table. Workbench recipes (pickaxes, swords, furnaces, doors, chests, etc.) follow traditional shaped voxel crafting arrangements. Other original MineWorld catalog recipes may use compact ingredient stacks as recipe shortcuts rather than exact Minecraft shapes; furnaces and smithing have their own simplified crafting flows.

Creative stays independent; Survival resources and crafted items cannot be transferred into Creative.

## Texture and biome improvements

- The original procedural **16×16 pixel texture atlas now paints all 168 block indices**, fixing blank or incomplete textures for the End, villages, crops and structures.
- Refined original grass, soil, sand, and stone texture patterns; added pixelated wooden crafting-table faces.
- Grass and common foliage colors respond to environment (cold taiga, yellow-green savanna, swamp, jungle, meadow).
- Overworld terrain now uses **irregular seeded biome boundaries** instead of repeating rigid square sections, with smoother transitions between hills, plains and coastlines.
- The existing 36 Overworld biome categories, biome Atlas, original trees, landmarks, mountains, caves and custom world seeds remain supported.
- Existing edits still load, but newly generated *unmodified* terrain may change appearance in previously explored places due to the biome-generator update. When a prior save is opened, the game attempts a one-time local backup named `mineworld-backup-before-biome-v37-<mode>` before migrating. These backups remain in that browser's local storage and are not uploaded to a server.

## Limitations

Crafting behavior and recipes are improved but are **not the entire official Minecraft recipe registry**. World generation and pixel-art textures are original approximations, not identical to Minecraft terrain generation or official textures. Multiplayer remains peer-hosted rather than a persistent dedicated server; shared crafting inventories are not server-authoritative. Different generator versions with the same seed can have different naturally generated layouts.

The website includes no Microsoft/Mojang code or original copyrighted texture-pack assets.

## 3.8 title screen redesign

The initial screen is redesigned in the spirit of classic voxel-game Java menus: a **large original MINEWORLD stone-style wordmark**, gently panning procedurally drawn block landscape, Singleplayer, Multiplayer, Creative World, Options and World Atlas. Singleplayer opens the existing Creative/Survival world-and-seed chooser; Multiplayer opens the existing public/private lobby. Options provides a panorama-motion toggle, full-screen attempt (where supported), and control reference. Returning home restores the main title screen.

The menu landscape, texture, lettering and art are independently generated and do not use Mojang/Minecraft assets or fonts. Gameplay and saves are unchanged by the menu-only update.


## 3.9: Survival hotbar earned through pickups

- A **new Survival world begins with nine empty hotbar slots**; the Creative preset block palette is no longer visible in Survival.
- Mining, loot chests, mob drops, farming, crafting and other inventory gains now fill empty Survival hotbar slots automatically. Multiple items of a type stack in the same slot; counts reflect what is actually owned.
- The first nine owned item types occupy the hotbar, and additional items remain in the 36-slot-per-page backpack. Open **🎒 Inventory** (or press E / tap Gear) to choose a different item. Select a stack and tap **Equip / Assign Hotbar** to assign it to the highlighted slot.
- Any type of backpack item, not only placeable blocks, can be assigned. Food can be eaten with the mobile PLACE button while held in Survival. Block placement consumes an owned block. Newly crafted tool items are now recorded in the inventory and can be equipped from the hotbar.
- Hotbar slot assignments save with your **Survival-only** world. Older saves migrate to inventory-backed slots using their genuinely owned resources; Creative remains unlimited and unchanged.
- The 10,000×10,000 seeded world, iPhone/iPad controls, multiplayer, crafting, Nether and End remain part of MineWorld. The game is still independent of Minecraft and does not use Mojang assets.


## MineWorld 4.0 — timed mining and crafting fixes

- Survival block breaking now takes actual time, with a visible progress bar. Click once to begin a break; hold the mouse button or touch MINE button to continue mining blocks. The active block and held tool must stay the same while a break is in progress. Switching targets or tools resets progress. Creative still breaks blocks instantly.
- All accessible blocks except the protected y=0 foundation can be broken with hands or any tool tier. Speed increases in this order: hand, wood, stone, iron, gold, diamond, netherite. Tough materials take longer. Mineable ore and other drops flow through the owned-item inventory so they appear on the Survival hotbar when space is available.
- Hostile creatures acquire visible Survival players within **25 three-dimensional blocks**, checking blocks between the creature and player for line of sight. Opaque blocks prevent new targeting; water and glass do not. Detection is recalculated a few times per second. Public multiplayer still uses peer-hosted simulation and has no 24/7 dedicated host.
- **Crafting fixes:** 2×2 inventory grid versus 3×3 only near a placed crafting table; tapping repeatedly adds ingredients, the **− Remove** toggle subtracts them; chosen ingredient defaults to an available owned item; taking the output consumes inventory ingredients once and clears the virtual input grid. Closing crafting now clears virtual ingredient reservations without losing items.
- The **Place / interact** control (right-click on desktop or PLACE on mobile) opens a targeted crafting table, chest, or dimension portal; the **Mine** control breaks it. A crafted table is placed on nearby clear ground using the gear panel's **Place Crafting Table** button.
- Existing Creative and Survival save formats are not replaced by this update. The map, inventory, seed, dimensions and multiplayer integrations remain unchanged.

**Limitations:** These mining times and craft recipes are original MineWorld approximations, not Mojang's exact hardness and recipe database. Combat and crafting have not been checked on a physical iPhone or with two real remote multiplayer devices.


## 4.1 — Uncluttered pause menu and original 16px block materials

**Pause menu**
- Only the **⏸ Pause** button remains in the upper-right corner of live gameplay (within iPhone safe-area insets). The crosshair, health/hunger, collected-item hotbar and mobile movement/action controls stay visible.
- Pausing opens a compact game-menu overlay organized into **Inventory & Crafting**, **Explore & Travel**, and **Friends & World Settings**.
- Inventory, blocks, gear and recipes, Nether, End, biome atlas, villages, multiplayer, saving, difficulty, creative flight, world mode, home screen and new-world actions remain accessible.
- The menu scrolls on short mobile screens and adapts from 2 columns to 1 column for portrait smartphones. **Resume Game** returns to gameplay; Escape still toggles the game menu on desktop.

**Pixel materials**
- The pixel-materials.js file supplies 16×16 pixel-art materials for **every defined game block**, all independently generated. The file is precached for offline/Home Screen play.
- Detailed texture families include top/side/bottom grass, cobbled and smooth stone, dirt, sand, spruce/birch/cherry bark grain and end-grain, wooden planks, leaf clusters, ores with larger veins, deepslate, Nether materials, End stone, farmland, crop stages, glass, decorative workstations, and many others.
- Texturing uses **nearest-neighbor** WebGL filtering, pixelated hotbar thumbnails, deterministic procedural variation and coherent 16px motifs rather than indiscriminate smooth gradients.
- These are original textures inspired by familiar voxel-block aesthetics. They are **not** copies of official Minecraft textures or a pixel-exact reproduction of the official game's copyrighted pixel patterns.

The existing 10,000 × 10,000 worlds, Survival/Creative saves, inventory, crafting, mobs, shared multiplayer and Nether/End generation are preserved. Physical-iPhone behavior and Internet peer-to-peer combat still require real-device checks.


## 4.2 — Pickups stack at 64 and consume to zero

- Inventory is opened from a large **🎒 INV** button located immediately to the right of the nine-slot hotbar, including on iPhones.
- Survival inventory now has real per-stack entries with distinct stable IDs. **All placeable blocks stack to 64 items**; further pickups create additional stacks of the same block (for example 130 stone becomes **64 + 64 + 2**).
- Individually nonstackable equipment and transportation objects get separate 1-item stacks. Other ordinary collectible materials generally stack to 64.
- Hotbar slots refer to specific stacks. Placing or eating uses one item from the chosen stack; when that stack reaches **zero**, its hotbar slot empties. A second stack stays available in the backpack or another slot, not infinitely refilling the first.
- A fresh pickup automatically occupies a free hotbar slot when it creates a new stack. A full hotbar leaves excess stacks in the backpack. Manual selection from backpack assigns exactly that stack to a chosen slot.
- Crafting and trading still use total resources, taking the costs from owned stacks; dropping a single item or a full stack targets the selected stack.
- Legacy inventory totals and older name-based hotbar assignments migrate to the new ID-based stacks. Stack entries and IDs are saved with the Survival world (version 11).
- Item storage has 36-slot **pages**, so the total number of pages is not yet limited to Minecraft's fixed inventory capacity. Aggregate per-item totals currently cap at 65,535, and displayed hotbar stack counts cap at 64.

## Improved pixel-art materials

- Refined 16×16 game-original textures with larger hard-edged pixel clusters instead of smooth color noise; richer grass/dirt edges, more irregular rocky cobblestone, clearer ore flecks, distinct tree and leaf patterns, and improved End stone.
- Every defined block type keeps its own original nearest-neighbor texture. Hotbar tile thumbnails now sit squarely aligned to the 16px atlas instead of being rotated.
- MineWorld does not ship or reuse official Minecraft texture files; these are independently authored approximations of the same recognizable blocky aesthetic.


## 4.3 texture remake

The entire 16×16 texture atlas has been revalidated across all 168 defined MineWorld block types. The new original artwork replaces generic random-noise colors with hand-arranged pixel motifs, distinct palettes and per-face variants.

- Grass and podzol: recognizable green top, irregular hanging grass fringe on earthy sides, dark underside.
- Stone and deepslate: hand-designed dark-light mineral patches; cobblestone and blackstone: outlined chunky stone shapes.
- Wood: individual oak, spruce, birch, acacia, jungle, cherry, pale oak, crimson and warped species, with vertical bark, species highlights, and rings on log ends.
- Ore faces: separate coal, iron, copper, gold, redstone, lapis lazuli, diamond, emerald, quartz and Nether gold shapes against stone/deepslate.
- Leaves: distinct green and pink clustered foliage; planks: visible seams and grain; snow, ice, sand, gravel and terracotta: cleaner hard-edged pixel coloration.
- Nether and End: netherrack, basalt, soul sand, magma, portals, nylium, wart blocks, end stone, End gateways and crystal details.
- Crafting table, chests, stone bricks, glass, resource blocks and workstations have stronger visual signatures.
- The game retains nearest-neighbor filtering, separate top/side/bottom UV mapping, the same saved block IDs, and all existing 64-item stack behavior.

This work is an independent classic 16x16 pixel-art approximation. No official Minecraft resource files, textures, or copyrighted pixel patterns are copied or included. Water, glass and portal transparency/animation still differ from the original game because the MineWorld engine currently renders opaque block faces.


## MineWorld 4.4 — classic-style block art refinement (October 24, 2026)

The existing pixel-art engine is preserved and now includes an additional original-art rendering pass for the most familiar blocks, while all other materials continue to use 4.3's distinct texture families.

- Grass blocks have a higher-contrast grass top with an uneven green overhang down a brown dirt side.
- Stone, deepslate, blackstone and cobblestone have larger hand-shaped-looking rock regions instead of uniform speckled textures; cobblestone uses jagged, outlined stone pieces.
- Ore rocks have clear distinct coal, iron, copper, gold, redstone, lapis, diamond, emerald, quartz and Nether-gold colored clusters; the ores remain embedded in stone or deepslate.
- Wood has more recognizable birch markings, grooves in bark, end grain, plank seam rows and type-specific timber colors. Leaf blocks are grouped into readable foliage patterns.
- Crafting table, furnace, glass, water, lava, obsidian, sandstone, soul sand, End stone and resource blocks receive additional clear details.
- **Preserved gameplay:** Inventory button beside the hotbar, 64-block stacks, Survival saves, Creative building, 3×3 crafting, mining break timers, mobs, multiplayer, dimensions, and all 168 block IDs remain unchanged.

This is original pixel art modeled on familiar block-based motifs and does not include or copy the official Minecraft texture files. It aims for better recognizability, not an exact copyrighted texture replica. MineWorld still has limitations in transparent water/glass rendering and fluid animation versus Minecraft.


## 4.6 visual finishing pass

This update further improves individually drawn 16×16 original block textures. It corrects podzol to a brown surface, makes the dirt side of grass blocks retain its natural brown color instead of inheriting grass biome tint, and removes random per-position shading so carefully chosen pixel palettes stay crisp. Wood, ore, brick, chest, crafting-table, and Nether/End textures from earlier releases remain in place.

Glass now has transparent interior pixels instead of a solid pale-blue texture. WebGL uses alpha testing to reveal the terrain behind the pane and emits neighboring opaque block faces so visible geometry does not disappear behind glass.

The world, seeds, existing block identifiers, inventory and 64-item stack logic are unchanged. The shader and generated atlas passed syntax/simulation checks; physical-device rendering remains to be verified.

These are independently authored texture approximations, not official Minecraft texture assets. Water and fluid animations are still simpler than Minecraft, and partially transparent materials do not have full order-independent transparency.


## MineWorld 4.7: 10–50 render chunks and adaptive performance

The **Options** screen and the in-game **Pause → Friends & World Settings** section both have a working **Render distance** slider with a 10–50 chunk range. A chunk is a 16×16-block region; the setting is the **total number of nearby chunks to display**, not a 50-chunk radius. The saved setting applies to both Creative and Survival in the same browser. Defaults are 18 on touchscreen devices and 32 on desktop.

**Automatic optimization** is enabled by default, with a checkbox to disable it. It measures recent frame rate and may temporarily reduce the active visible-chunk count (down to 10) when FPS is low. It restores chunks gradually when performance recovers. The setting displays requested range, current active chunks, loaded chunks and recent FPS. User preference and auto toggle persist separately from saved worlds.

Rendering refinements:
- A deterministic nearest-first, world-edge-safe chunk planner produces exactly the requested count for large regions.
- One new chunk loads per frame on touch devices; desktop loads up to two per frame when conditions permit.
- At most one chunk mesh rebuild per touch frame and two desktop meshes, with a millisecond-time ceiling for extra rebuilds.
- Meshing no longer calls world-generation logic for adjacent chunks: only cached visible neighbors are checked, and neighboring edge faces are refreshed when chunks stream in.
- Far-away chunks behind and well outside the camera's view are culled before drawing.
- Adaptive render resolution on slow devices and distance-matched fog reduce visible abrupt terrain edges; unused chunk GPU buffers and data are evicted with a bounded cache.
- A high render setting is a **maximum quality preference, not a guarantee of lag-free performance** on all phones or hardware. Automatic optimization can limit the active count to keep gameplay responsive.

Pixel textures were further refined with original 16×16 textures: bark and log end-grain for more wood species, oak/spruce boards, foliage clusters, sandstone bands, glowing magma cracks and End-stone pits. These are independent Minecraft-inspired pixel patterns, not Mojang assets.

**Verification:** Script syntax, planner determinism, 10–50 visible counts and boundary behavior, no extra chunks from mesh-neighbor reads, cache cap under movement, and all 129,024 atlas pixel color values were tested. Physical iPhone graphics and long-running 50-chunk frame rates have not been measured on a physical device.

## 4.9 — Wiki-informed block appearance

- Reviewed Minecraft Wiki's block and block-texture catalog to match the familiar 16×16 pixel resolution, different top/side/bottom faces, and material categories.
- New `texture-refinement.js` supplies original, deterministic 16px patterns for grass/dirt, stone/deepslate, cobblestone, sand/gravel, logs, planks, water/lava, and ore varieties. Existing `pixel-materials.js` still covers every one of MineWorld's 168 currently defined block IDs.
- Official Minecraft texture images are not included or copied. The wiki describes many more block types than MineWorld currently implements; this update does not claim to add every Minecraft block.
- Sprint and sneak controls already exist: desktop Ctrl or G to sprint, Shift or X to crouch; on mobile, use the SPRINT and SNEAK toggles. Sprinting costs extra hunger while moving and cannot start at 6 hunger or less. Sneaking slows movement and helps prevent stepping off ledges.
- The 10–50 chunk slider and automatic frame-rate adjustment remain in the game menu. Actual performance varies with the device.

## 5.0 — Wiki-guided movement, materials and performance

- **Classic 16px textures:** A new original artwork layer, `texture-details.js`, refines chests, furnace faces, crafting workbench, stone and Nether bricks, netherrack, magma, obsidian, End stone, glowstone, sandstone, prismarine and other materials. It complements the original independently drawn 16×16 patterns already used for all **168 MineWorld block IDs**. It does not copy Mojang-owned texture PNGs or add the entire Minecraft block registry.
- **Different block dimensions:** `block-models.js` now includes Soul Sand at 14/16 height, Farmland at 15/16, narrow lanterns/rods, chests, portal frames, decorative plants, brewing stands, lecterns, and others. Raycasts and placement collision now honor those simplified model boxes. Complex multipart models remain approximations.
- **Sprint and sneak:** Ctrl or G to sprint; Shift or X to crouch on desktop, plus touch SPRINT and SNEAK controls. Sprinting widens the field of view. Crouching reduces player height to 1.5 blocks and reduces local mob sight from 25 blocks to around 15, if no wall blocks line of sight.
- **Wiki-informed food system:** Sprinting accumulates 0.1 exhaustion per block traveled; sprint jumps cost 0.2, normal jumps 0.05, attacks 0.1 and mining 0.005. When exhaustion reaches 4, it spends hidden saturation first, then visible hunger; food restores both. Survival nutrition is saved with version 12 and earlier world save data is backed up on migration. Sprinting requires more than 6 hunger.
- **Performance:** The existing Pause → World Settings slider chooses a **total of 10–50 visible 16×16 chunks**; auto mode reduces the active count when FPS falls. Terrain edits are now indexed by chunk instead of scanning all saved edits for each newly streamed chunk. No device, particularly at 50 chunks, is guaranteed to run without lag.
- **Game compatibility:** Preserved Creative/Survival saves, 64-item stack behavior, pickup-first Survival hotbar, inventory shortcut, crafting and multiplayer structures.

Minecraft Wiki references: [Blocks](https://minecraft.wiki/w/Block), [Sneaking](https://minecraft.wiki/w/Sneaking), [Sprinting](https://minecraft.wiki/w/Sprinting), [Hunger](https://minecraft.wiki/w/Hunger). This is an independent interpretation of relevant documented mechanics, not the full Wiki or Minecraft engine.

Validation: JavaScript syntax, 129,024 texture pixels, block dimensions, raycasts, edited chunk indexing, the 10–50 chunk planner, and saturation/exhaustion module were checked. Physical iPhone render performance and long multiplayer sessions were not tested.


## 5.1 — Minecraft Wiki-informed survival features

This feature pass is **not a Minecraft port**. MineWorld remains an independently implemented browser voxel game with original art. Minecraft Wiki pages on [beds](https://minecraft.wiki/w/Bed), [daylight](https://minecraft.wiki/w/Daylight_cycle), [weather](https://minecraft.wiki/w/Weather) and [experience](https://minecraft.wiki/w/Experience) informed the behavior.

### Functional red beds
- Craft one red bed at a 3×3 crafting table with **three wool and three wooden planks**, arranged in two rows. Sheep in Survival drop one wool alongside their existing food drop.
- Bed item **block 169** has its own hand-authored 16×16 pillow, red cover and wooden-frame texture with a **9/16 block tall** collision model.
- **Place** the bed from the hotbar, then **use/interact** with it using right-click or the mobile Place button while aiming at it. Daytime interaction sets a personal respawn point; at night, solo use also skips to morning and clears the rain.
- On death in Survival, you respawn beside the saved bed if it is still present and has free adjacent standing space; otherwise, respawn defaults to your original world spawn. A saved bed in the Nether/End cannot be used to sleep.
- Beds are simplified **single-block** props, not Minecraft's exact two-block bed meshes. Multiplayer night-skipping is disabled because MineWorld doesn't implement cross-player sleep voting. Survival saves store their new bed-spawn coordinates; an old generic `bed` backpack item is migrated to a placeable bed once when the save loads.

### Weather and day/night
- MineWorld now uses a **20-minute game day** aligned to Minecraft Wiki's 24,000-tick cycle, rather than its older roughly 7-minute sunrise/sunset approximation. Older save times are converted to retain their approximate previous day/night phase.
- The Overworld cycles between **clear, rain and storms**. Cold biome precipitation appears as snow. Darkened storm skies and a light, resolution-capped weather overlay are included; the number of particles falls on slower devices.
- Rain/storm durations are deliberately **shorter than Minecraft's real timers** so the weather can be seen in normal browser sessions. Creative's pause menu can change weather immediately; Survival follows a predictable dynamic cycle. Weather state persists with each saved world.
- Nether and End are not given Overworld precipitation.

### Experience levels
- New compact green **XP bar** and level number appear above the Survival hotbar.
- Experience is earned by mining resource ores, defeating creatures, and smelting. Level thresholds follow the Minecraft Wiki experience formulas, including **level 16 at 352 XP** and **level 31 at 1,507 XP**. Rewards are simplified per action. Experience is lost on death.
- Total XP is kept separately from the old collectible `experience` resource and saved with the current Survival world.

### Original block textures

**Additional classic-style layer:** `texture-polish.js` now actually loads after the other three atlas layers. It supplies original hand-arranged 16×16 grass, dirt, stone, gravel, sand, planks, leaf, water and lava surface patterns. Every defined block continues to have a distinct 16-pixel atlas entry, but all patterns are independent rather than copied from Mojang art. The new polish was sampled across all 169 block IDs and three faces with no invalid colors.
- Retains 16×16 nearest-neighbor texture atlas, with a new **red bed** and more distinct snow, ice, terracotta, hay bale, bone, redstone lamp and raw-mineral crate pixel patterns. These hand-authored motifs complement the grass, dirt, stone, wood and ore refinement layers.
- **No Minecraft texture files have been copied** from the Wiki or the game. Texture likeness remains an original interpretation of the materials, not pixel-for-pixel official art.

### Existing functionality retained
- Sprint and sneak with saturation/exhaustion logic (Ctrl/G and Shift/X, or mobile toggles)
- 10–50 simultaneously visible 16×16 terrain chunks, frame-budget streaming and adaptive rendering
- Separate Survival/Creative saves, actual 64-item stacks, 2×2/3×3 crafting, Nether/End, village trading, mobs and peer-hosted multiplayer

**Not yet implemented:** the complete Minecraft block/item catalog, full redstone circuits, exact chunk-radius rendering, all official mobs, tool durability/enchanting/anvils, hunger/loot details in every circumstance, two-block bed meshes or fully simulated Java/Bedrock multiplayer servers. Performance and touch behavior should be verified on a physical phone. Save payload version: **13**.
