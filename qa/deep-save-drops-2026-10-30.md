# Deep-world migration QA: dropped items and respawn (2026-10-30)

## Reproduction before fix
The opt-in `planLegacySaveMigration` validated terrain edits, furnace records
and player positions, but ignored `droppedItems` and `bedSpawn`. A save
containing a dropped stack outside the legacy world, or a respawn bed that the
legacy loader would silently clear, could receive a successful migration
preview without preserving this player-owned state.

## Fix
Preview and validate every dropped stack (including item key, quantity,
dimension, absolute position and optional motion/age/delay). Preserve a
detached frozen copy of valid records. Validate the saved bed respawn using
the live legacy bounds. Reject the entire preview on malformed data instead
of silently truncating drops or clearing the bed.

## Scope and verification
Regression tests: `tests/deep-save-drops-preflight.test.cjs`.
The feature remains **preview-only**: no live 384-layer switch, no entity
coordinate rewrite, no world save mutation, and no claim of a full survival
playthrough. This test uses independently written fixtures, not copyrighted
game artwork.
