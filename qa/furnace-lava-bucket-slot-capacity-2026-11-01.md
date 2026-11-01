# Nonstackable lava-bucket furnace controls — November 1, 2026

## Before: reproducible control-state bug
A Survival player holding multiple lava buckets could select lava fuel and see **Add Stack** enabled, even though the engine accepts at most one bucket. After adding one, both Add controls remained enabled; tapping again attempted an inventory debit and refund rather than a valid transfer. The defect was misleading controls and unnecessary temporary reservation, not confirmed item loss.

## Fix
Shared `MineWorldFurnace.slotCapacity(which,item)` determines the engine insertion cap, the inventory reservation, and the furnace picker button state. Lava buckets cap at one, coal and ordinary inputs at 64. Add Stack is disabled for a nonstackable container, and Add is disabled when that slot is occupied.

## Verification and limitations
New Node regression tests exercise capacity, 40-bucket reservations, repeated deposits, withdrawals, and ordinary 64-item stacks. The desktop/mobile Chrome smoke script now grants three lava buckets in an isolated Survival furnace with the independently generated resource-pack fixture loaded, tests the disabled controls and one-bucket slot, saves a device-specific screenshot, and withdraws the bucket before completing the existing smelting test. This is not a player-provided Minecraft texture pack. The workflow uploads screenshots and recordings, but these are not dedicated before/after clips. Existing saves, burn timers, and the still-experimental 384-layer world are unchanged.
