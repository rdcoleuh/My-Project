# Generic hotbar slot import fallback — 2026-10-30

## Reproduction
A player-imported Bedrock pack can contain `textures/ui/hotbar_slot.png` with a non-square GUI strip (e.g. 22×182) or a fully transparent 20×20 placeholder, alongside a valid 180×20 `hotbar.png` sheet. Before this fix, `hudIcon('hotbar','slot')` took the standalone path and returned the malformed image without the aspect-ratio or alpha checks already applied to numbered slot candidates. A caller could stretch it across a square hotbar slot.

## Fix
Validate the generic slot's dimensions using `validSlotSprite` and visible alpha using the same canvas probe as numbered slot imports. Invalid generic art now returns `null`; `slot0` through `slot8` independently fall through to crisp source-pixel sheet crops. Preserve valid player-owned square art precedence, transparency, and procedural fallback.

## Verification
Node regression: `tests/hotbar-generic-slot-validation.test.cjs`.
Desktop/mobile Chrome smoke: synthetic malformed-strip and transparent-generic fixtures with nine 20×20 sheet-derived crops; screenshot names include `generic-slot`. These fixtures are original generated artwork, **not** the user's resource pack. Browser smoke video captures are general gameplay; no pre-fix video was recorded. Do not claim a before/after recording.

## Scope
This does not activate the 384-layer Overworld or change save formats. The playable world remains H=48, SEA=14 until the versioned terrain/rendering/multiplayer migration is complete.
