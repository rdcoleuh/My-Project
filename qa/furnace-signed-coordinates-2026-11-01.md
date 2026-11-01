# Signed furnace coordinates — 2026-11-01

## Reproduction and fix

The experimental deep-world chunk stream supports negative X/Z, but the furnace engine rejected every station west or north of origin. Simply allowing signed coordinates would expose a second issue: the legacy blast-furnace block-ID upgrader can calculate a positive dense-array index from a negative coordinate, potentially changing an unrelated cartography table.

The furnace engine now accepts safe-integer X/Z positions from -9999 through 9999 (and absolute Y -64 through 319), preserving all formerly valid coordinates and save fields. The legacy blast-block upgrader explicitly skips negative X/Z because those positions never existed in the old positive-only dense world.

## Verification plan

Run `node --test tests/furnace-signed-coordinates.test.cjs` and the complete Node suite. Verify positive-coordinate legacy saves, signed-coordinate save/reload, independent chunk boundaries and dimensions, invalid-coordinate rejection, and prevention of legacy index aliasing. GitHub Actions also runs desktop and mobile Chrome smoke tests with independently generated Bedrock resource-pack fixtures. Signed-coordinate furnaces are staging support only: the playable Overworld still uses H=48 and SEA=14. No dedicated before/after browser recording can demonstrate negative-coordinate furnaces in live gameplay until the deep-world renderer is connected.

No proprietary Minecraft art or code is included.
