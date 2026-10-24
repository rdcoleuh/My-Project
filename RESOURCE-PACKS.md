# MineWorld 5.7 — Sounds and local resource packs

## What changed

MineWorld now includes **independently synthesized** digging, placing, footsteps, jumping, attacking, taking damage, eating, picking up items, opening chests, and other interaction sounds. They do not use Minecraft or Eaglercraft audio files. Open **Pause → Original sound effects** to mute, adjust volume, or test audio.

MineWorld also supports **optional local resource ZIP imports**, allowing compatible block PNG textures and OGG sounds from a file you select yourself. The importer does not fetch or download proprietary assets, store ZIP bytes, upload anything, or add anyone else's art/sounds to this GitHub repository.

### Importing a local pack

1. Open https://rdcoleuh.github.io/My-Project/ and refresh if you see an older cached version.
2. On the main screen, scroll down to **Import local textures and sounds**. Or enter a world, open **Pause**, and find **Local resource pack ZIP: textures + sounds**.
3. Choose a **Java-style resource pack ZIP** containing textures and/or audio under paths such as:
   - `assets/minecraft/textures/block/stone.png` (modern packs)
   - `assets/minecraft/textures/blocks/stone.png` (older packs)
   - `assets/minecraft/sounds/random/pop.ogg` (sound replacement)
4. Import succeeds if the ZIP has one or more matching usable textures or playable sound effects. The status shows how many block faces and sound events were replaced.
5. Select **Restore original art & sounds** or reload the page to restore MineWorld's independently made textures and procedural effects.

Some blocks in MineWorld have different names, geometry or IDs. Not every PNG will map, and not all audio clips will play (decoding support depends on the browser). The ZIP importer intentionally displays the **first frame** of animated sprites and resamples high-resolution sprites to MineWorld's original 16×16 block texel grid.

**Limitations:** Direct Eaglercraft `.epk` bundles, Eaglercraft client binaries, Minecraft resource registries, and entire Minecraft Java installations are not supported. The importer supports only the ZIP/JAR resource layout described above. The app doesn't redistribute imported artwork or sounds. You are responsible for only using assets as allowed by their licenses and rights holders. User-supplied packs aren't stored across reloads.

## Bug fixes and checks

- Fixed legacy world migration to always write to **Original Creative** or **Original Survival** rather than an unrelated selected multiworld slot.
- Imported textures now update block-guide previews and inventory swatches; animations stop modifying imported texture sprites until the original textures are restored.
- The importer rejects overly large archives and protects against ZIP records that lie about their decompressed size.
- A fresh offline cache includes the sound engine and importer.
- Automated tests now cover ZIP archive parsing, local texture/audio replacements, sound synthesis and muting, old-world-save keys, and static syntax/integrity checks for **all game JavaScript modules** and directly referenced interface IDs.

The tests do not prove that every in-game scenario or device is free of bugs. Continue reporting specific issues so they can be reproduced and fixed.

