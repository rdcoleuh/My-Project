# Furnace withdrawal reconciliation — 2026-10-31

## Reproduction (prior branch head `212bf68220482ea16d2d5c95e1a60ddbd6f629a6`)
Create a furnace with two cooked iron ingots. Wrap `engine.take` so it reports
`{key:'iron',qty:2}` without removing anything. The original UI withdrawal
credits two ingots to the player and leaves two in the furnace: total grows
from two to four. This was reproduced against the unmodified branch code in
the automation's JavaScript runtime.

## Fix
In `furnace-ui.js`, snapshot the furnace slot count before `take`, inspect
the slot after `take`, and settle the inventory credit against the actual
decrease, not the adapter's return value. When `take` throws after a partial
mutation, refund only the untransferred portion, then rethrow. Reject
impossible or cross-item slot changes instead of reporting success. No
save schema or furnace recipe changes.

## Regression coverage
`tests/furnace-withdraw-reconciliation.test.cjs` covers a fake successful
withdrawal, an underreported real withdrawal, an overreported partial
withdrawal, a partial mutation followed by an exception, an existing input
stack, and an invalid changed-item mutation. The service-worker version is
bumped so clients refresh the UI module.

## Evidence and limitations
The pre-fix duplication was reproduced in an isolated JavaScript engine
harness. The post-fix logic passed five equivalent isolated checks before
commit. CI Node and desktop/mobile Chrome checks must be inspected after
the push; no dedicated browser before/after recording was captured locally.
Browser resource-pack fixtures are independently generated and are not a
user-supplied Minecraft pack.
