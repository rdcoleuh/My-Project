# Furnace burn-timer restore integrity — 2026-10-30

## Reproduction before the fix
Restore a furnace with 8 raw iron, no fuel, `burn:800` and `burnTotal:0`. The old restore code clamped each number independently, allowing the engine to smelt all 8 ingredients despite having no active fuel. An infinite or otherwise corrupt pair of timers could similarly be normalized into free burn time.

## Fix
Only finite numeric saved timers are accepted. Remaining burn is clamped to the recorded total, and a missing, zero or invalid total yields zero active burn. Legitimate partial fuel records, including the 800-second coal-block burn and fractional smelting progress, retain their values. Inventory and save schema are unchanged.

## Verification
Node tests reproduce the old free-smelting bug, test invalid and overlarge timers, and verify normal coal-block saves plus legitimate fuel ignition. The existing desktop and mobile Chrome smoke suite exercises furnace UI, imported synthetic texture-pack assets, touch controls and world persistence. No personal texture pack was available.

## Limitations
The browser suite does not inject corrupt save timers into a live gameplay world or capture dedicated before-and-after video of this save repair. The deep 384-layer Overworld is still experimental and not integrated into playable terrain.
