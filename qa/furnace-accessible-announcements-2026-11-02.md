# Furnace screen-reader status and focus — November 2, 2026

## Reproduction
The visual furnace status changes every 250 ms and previously used `role="status" aria-live="polite"`. This can flood screen-reader announcements with changing timers during smelting.

## Fix
The continuously changing status is now visual-only (`aria-live="off"`). A separate visually hidden polite region announces only newly smelted output, fuel ignition, and fuel exhaustion. Opening an already-burning furnace establishes a baseline without replaying old events. Closing the modal returns keyboard focus to its opener when still connected.

## Tests and limits
Five Node regression tests cover event transitions, markup, and focus-restoration code. Existing desktop/mobile Chrome smoke workflows run on push. No physical screen reader or user-owned Java/Bedrock resource pack is available; fixture packs used by the browser workflow are independently generated. No save schema, recipes, fuel durations, or game artwork changed. A full survival playthrough and final-boss victory remain unverified.
