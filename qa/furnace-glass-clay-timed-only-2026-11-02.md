# Furnace-only glass and terracotta — 2026-11-02

## Reproduction

The Survival crafting catalog exposed **Glass** as sand + coal and **Terracotta** as mud + coal at a crafting table. Both entries bypassed the furnace input/fuel/output slots and ten-second smelt timer. Mud (block 47) is not clay (block 57).

## Change

Removed the two instant-crafting recipes. Added furnace-only preview entries for sand (block 4) → glass (block 9) and clay (block 57) → terracotta (block 25), with coal shown as an example fuel. The existing furnace engine already implements both timed conversions, so no save schema or engine behavior changed. Updated the service-worker cache key.

## Verification plan

Run the full Node suite and desktop/mobile Chrome smoke in GitHub Actions. The browser test uses a separately generated synthetic resource pack, cooks both materials in an actual placed furnace, checks input consumption/output collection, and saves screenshots. Confirm deployment and report links only after successful workflow checks. No proprietary bitmap assets are committed.

## Limitations

This patch does not activate the experimental Y=-64..319 Overworld, complete the full survival progression, or provide player-owned texture packs. Existing recordings are not before/after captures of this bug.
