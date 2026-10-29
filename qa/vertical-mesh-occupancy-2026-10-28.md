# Vertical mesh occupancy (2026-10-28)

The previous renderer scanned every Y layer in every visible chunk. The new live renderer skips all-air 16-high sections, preserving face visibility across section boundaries. A 48-layer chunk has three occupancy bytes; a future 384-layer chunk has 24. Placement marks empty slices occupied immediately; deletion leaves a conservative flag. Geometry uses absolute Y and storage uses local Y.

Regression coverage: negative-Y and Y=319 occupancy, partial sections, invalid data, and live integration. Existing world height and save format are unchanged. This is a staged performance and meshing improvement, **not** activation of the 384-layer world. Lighting, collision, streaming, and save migration still require work. Browser videos are general smoke demonstrations, not before-and-after proof of this change.
