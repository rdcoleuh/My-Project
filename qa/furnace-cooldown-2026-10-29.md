# Furnace interrupted-smelt cooldown regression — 2026-10-29

## Reproduction before fix
1. In a private Survival world, put raw iron and one stick into a furnace.
2. Let it burn for five seconds (half of a ten-second smelt), then wait with no fuel.
3. The former engine retained five seconds of progress indefinitely. A later fuel item resumed immediately from that stale progress.

## Change
When the furnace has a valid input/output path but no active burn or fuel, its partial cook progress now decays by two seconds for every real elapsed second, bounded at zero. It reports `changed` during cooling so the existing save loop can persist it. Active burn, output-blocked behavior, item inventories and saved schema remain unchanged.

## Verification and limits
The new Node regression tests cover one-stick exhaustion, one-second and fractional cooling, zero floor, no repeated dirty saves when idle, a full ten-second restart, and save/restore while cooling. A V8 preflight directly executed the updated engine and passed the key scenarios. CI Node and desktop/mobile browser results must be checked separately after push. No user-owned texture pack was available to this regression harness; no before/after browser video was captured in this run. The 384-layer Overworld is still experimental and not playable.
