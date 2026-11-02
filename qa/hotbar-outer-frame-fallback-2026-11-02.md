# Hotbar shared-border false positive — 2026-11-02

## Reproduction
An independently generated 182×22 Java-style hotbar PNG with only the top and bottom outer frame opaque was incorrectly accepted as a complete nine-slot sheet. The per-cell alpha check scanned the entire sheet height for every slot; shared frame pixels made nine transparent slot interiors appear valid. A pack containing only that frame could suppress the procedural hotbar backgrounds.

## Fix
Limit each cell's alpha scan to its own UV rectangle, excluding the outer shared frame. Per-slot border pixels inside those rectangles still qualify, so genuine thin-outline imported slots remain supported. Existing 180×20 seamless sheets, 1×/2×/4× scaling, and independent numbered/generic slot sprites retain their existing handling. No proprietary bitmap assets are bundled.

## Regression and browser evidence
Node tests reproduce the outer-frame false positive, confirm per-slot outlines and single-blank-cell rejection, and preserve all existing nine-cell validation tests. Desktop/mobile Chrome smoke tests import an original synthetic Java-style ZIP fixture, assert that its unusable background and derived slots are rejected, and save post-fix screenshots. The workflow's video artifact may include this browser session but is not a dedicated before-and-after recording. No user-owned texture pack is accessible in this run.

## Remaining work
The live world still uses 48 vertical layers; the experimental Y=-64..319 profile has not been enabled. No furnace or mob simulation changes are made in this patch.
