# Furnace restore integrity — 2026-10-30

## Reproduced defects

1. **Duplicate saved furnace positions:** `restore(records)` previously wrote every record to the same Map key. When a second record had the same dimension and x/y/z, its inventory silently replaced the first machine's input, fuel, and output. This can lose player-owned items in a duplicated/corrupted save.
2. **Orphaned smelting progress:** a saved furnace with no valid input but `progress: 9` restored that progress. After the player inserted a new ingredient and fuel, one second of burning could produce an item instead of the required ten.

## Fix

- Restore the **first** valid record for each physical furnace position; ignore later duplicates. This deterministic policy avoids overwriting the first saved inventory. It cannot recover distinct items already stored in conflicting duplicate records; those records need manual recovery from a backup.
- Reset saved progress to zero when the input slot is absent or invalid. Keep legitimate partial progress when a valid ingredient is present.
- Update the service-worker cache version to deliver the corrected engine.

## Verification

`node --test tests/furnace-restore-integrity.test.cjs` covers duplicate preservation, a fresh ingredient's full cook time, malformed input, legitimate partial cooking, and snapshot round-trip. The existing full Node suite and desktop/mobile Chrome smoke pipeline must also pass before calling this deployment verified.

This is a **deterministic engine-level regression**, not a bug reproduced visually in the browser. The generic Chrome smoke workflow records desktop/mobile gameplay, but does **not** capture a dedicated before/after clip for this save corruption. Browser pack checks use independently created synthetic Bedrock fixtures unless a player-owned pack is actually available. No proprietary game textures are bundled.

## Follow-up

Continue live Overworld Y -64..319 integration with explicit legacy-save migration, collision/lighting/network checks, and mobile mesh budgets. Do not switch legacy worlds to the new indexing scheme without full migration coverage.
