# Deep-world partial-block face occlusion — 2026-10-29

## Reproduced defect (experimental section planner)
A full stone block beside a cactus (44), portal (87), crop (139), or cauldron (162) lost its shared face because the planner treated all non-air neighbors as fully opaque. This also occurred across horizontal chunk boundaries. The resulting staging geometry would make walls appear missing after the 384-layer renderer is integrated.

## Change
Extend the original section face planner's conservative non-occluding registry to include known non-full-cube MineWorld blocks: plants, decorations, portals, crops, farmland, inset containers, workstations, and beds. Keep full-cube furnaces and solid stone occluding, and retain same-type internal-face culling for mobile mesh budgets. This is original code and contains no imported or redistributed artwork.

## Reproduction and regression checks
- Adjacent stone + cactus/crop/portal/cauldron: expect 11 visible faces (stone face retained), not 10.
- Stone at local x=0 + neighboring chunk's partial block: expect six stone faces, not five.
- Full-cube furnace adjacent to stone: expect ten faces (normal internal occlusion).
- Two identical crops or cauldrons: expect ten faces, not duplicate internal geometry.
- Run all Node tests and desktop/mobile Chrome smoke through GitHub Actions; inspect Pages workflow and branch head.

## Limitations
This planner is staging-only. The playable world remains H=48 and SEA=14, so browser gameplay recordings cannot show a visual before/after of this change. No personal Java/Bedrock texture pack was available; the existing browser tests use clearly labeled independently created resource-pack fixtures. This does not complete deep-world rendering, collisions, lighting, save migration, multiplayer, or a full survival/endgame playthrough.
