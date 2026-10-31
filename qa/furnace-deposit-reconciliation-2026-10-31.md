# Furnace deposit reconciliation — 2026-10-31

## Reproduction
With a furnace inventory adapter that inserts three input items but reports that it inserted one, the previous UI transfer function refunded two items to the player's inventory despite all three already being in the furnace. The opposite mismatch could silently consume items. An adapter that threw after partially inserting a stack could also trigger an unconditional full refund.

## Fix
Compare the furnace's actual input/fuel stack quantity before and after the insertion, reconcile the inventory debit against the observed delta, and refund only the remainder. If insertion throws after a partial mutation, preserve the partial transfer and rethrow. Reject an impossible slot state rather than assuming a valid transfer.

## Regression
Five Node tests cover underreported, overreported, no-op, throwing-partial, and existing-stack cases. Existing furnace interaction and inventory APIs remain unchanged.

## Limitations
The production furnace engine normally returns an accurate count; these cases protect against future integration and adapter regressions. No claim of a browser-recorded before/after reproduction is made. The playable world height remains H=48, SEA=14.
