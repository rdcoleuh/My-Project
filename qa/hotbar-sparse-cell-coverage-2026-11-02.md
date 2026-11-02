# Sparse hotbar sheet fallback (2026-11-02)

An independently generated 182×22 imported GUI bar with one opaque pixel per slot previously passed the alpha-presence check, hiding MineWorld's procedural backgrounds. The importer now requires at least 5% visible texels in each of nine cells, preserving thin native-pixel outlines, integer-scaled HD art, transparent pixels, and exact UVs. No proprietary artwork is bundled.

Node regression cases cover sparse native/HD sheets, a missing slot and the 19/20-pixel boundary. Desktop/mobile Chrome smoke tests import a synthetic ZIP, verify the unusable bar and derived slots are rejected, and save screenshots. This fixture is independent test art, not a user's pack.

No pre-fix browser recording was captured. Live 384-layer Overworld migration and full endgame playthrough remain unfinished; no save schema or furnace mechanics change here.

## Browser-discovered integration defect
The first desktop Chrome smoke run failed after Node tests passed: the background
rejected a sparse sheet, but `hudIcon('hotbar','slot0'..'slot8')` still accepted
one-pixel crops because the numbered-slot candidate path checked only the crop.
The importer now validates the entire source bar before accepting any derived
numbered slot, including cropped legacy Java widget atlases. The failing
browser fixture is retained as a regression check. The first CI run
41472114869 is recorded as failed; subsequent results must be checked separately.
