# Furnace XP/save consistency — 2026-11-01

## Reproduction and fix
Before: collecting furnace output called the transfer's `onChange` save callback
before awarding Survival XP. A save snapshot taken immediately in that callback
could persist the new iron ingot but the previous XP total. The output item
could not be collected again after reload.

After: the optional pre-save transfer hook awards XP from the verified output
quantity **before** `onChange` snapshots the inventory and furnace state.
Rejected/full transfers still award no XP. A failed reward callback does not
prevent the already completed inventory transfer from being saved; it reports
a warning instead.

## Verification scope
Node tests cover one-item collection, multi-item collection, full inventory,
reward-adapter failure and the live UI callback ordering. Existing desktop
and mobile Chrome smoke coverage continues to exercise furnace collection.
No Minecraft bitmaps are bundled. This is a furnace save-consistency change,
not a 384-layer playable-world activation or a full survival playthrough.
