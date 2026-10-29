# Furnace inventory transfer integrity — 2026-10-29

## Reproduction before fix
In the furnace UI, depositing input or fuel called `engine.insert` before deducting inventory through `api.change`. If inventory reconciliation rejected the debit, the furnace could retain newly inserted items without the player's inventory losing them. Collecting furnace output had the inverse ordering: `engine.take` ran before the inventory credit. If the credit failed, the furnace output disappeared without reaching the player's inventory. These are failure-path integrity defects, not evidence of a reproduced exploit in ordinary browser play.

## Fix
Reserve the source item first in `deposit`; only insert after the full debit succeeds. Refund inventory if the furnace rejects all or part of the transfer. For withdrawals, credit the destination first, and only then remove the credited quantity from the furnace, with a rollback on a failed engine take. Preserve the existing furnace save schema and the 64-item furnace-slot/65,535-item inventory limits. Refresh Add-button availability immediately when the player changes the selected input or fuel on desktop or mobile.

## Regression checks
`tests/furnace-atomic-transfers.test.cjs` covers successful deposits, failed inventory debits, unsupported recipes and refunds, failed inventory credits, capped inventory output collection, input withdrawal, and dropdown refresh wiring. The repository's standard Node and desktop/mobile Chrome smoke workflow is the verification gate; consult the workflow result for actual pass/fail status.

## Video and resource-pack limitations
The automated Chrome recordings are broad gameplay and UI smoke tests; they do not establish before-and-after footage of the failed debit/credit scenarios. Browser resource-pack checks use an independently generated synthetic fixture, not the player's owned Java/Bedrock pack. No copyrighted textures are included in this change.

## Unchanged scope
The playable Overworld still uses 48 layers. Experimental 384-layer rendering, collision, save migration and multiplayer are not integrated by this fix. A full survival progression and final-boss defeat are not verified.
