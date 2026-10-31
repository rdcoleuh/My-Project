# Furnace interrupted-transfer persistence — 2026-10-31

## Reproduction
A furnace inventory adapter can mutate its stack and then throw. The
`deposit` and `withdraw` routines correctly reconcile observed item
movements before rethrowing, but the UI event handlers previously skipped
`api.onChange()` because the exception bypassed their success branch.
A partial transfer could therefore remain unsaved until another event.

## Fix
Route both deposit and withdrawal clicks through `commitTransfer`. A
successful nonzero transfer saves and redraws once. On an interrupted
transfer, conservatively save and redraw the reconciled state, then show
a short nontechnical toast. No-op and full-inventory results remain
unchanged. This changes no furnace save format or recipe.

## Regression
`tests/furnace-interrupted-ui-save.test.cjs` exercises normal deposits,
partial inserts that throw, partial output withdrawals that throw,
no-ops, and failures before mutation. It also checks that both real
click handlers use the guarded wrapper.

## Browser evidence
The existing desktop/mobile Chrome smoke suite exercises the normal
furnace and synthetic player-importable pack paths. Adapter failures
are simulated in Node because a normal browser session cannot reliably
reproduce a throwing internal inventory adapter. No before/after
browser recording of this internal fault is claimed.
