# Furnace inventory-adapter exception rollback — 2026-10-31

## Isolated reproduction
In `furnace-ui.js`, `deposit()` previously called `api.change(item,-quantity)` without catching an exception. An inventory adapter that deducted items and then threw could leave the player inventory reduced with no furnace input. Similarly, `withdraw()` could credit the player's inventory and then throw before removing furnace output, duplicating items. These are isolated JavaScript adapter reproductions, not claims of browser-visible gameplay footage.

## Fix
Capture adapter exceptions, measure the inventory's actual before/after balance, reverse that observed mutation, then rethrow the original exception. Also reverse measurable unexpected changes in the opposite direction. No furnace insertion/removal is attempted when the inventory debit/credit fails.

## Regression coverage
`tests/furnace-inventory-exceptions.test.cjs` covers before/partial/after mutation exceptions on both deposit and withdrawal, opposite-direction mutations, and retrying after an interrupted deposit. Existing furnace-transfer tests cover normal operations and furnace-adapter failures.

## Limits
If the inventory adapter also refuses or throws during the compensating rollback, or if `count()` lies, this interface cannot guarantee atomicity. A transactional inventory API would be needed for stronger guarantees. No dedicated before/after gameplay recording was captured for this adapter-level defect. Browser smoke recordings, if uploaded by CI, are general gameplay evidence, not reproduction footage. Resource-pack browser tests use independently generated fixtures, not the player's personal Minecraft texture pack.
