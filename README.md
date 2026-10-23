# Minecraft Web — Java Edition 26.3 (Gaius integration)

This website embeds **the experimental Gaius browser port of Minecraft Java Edition 26.3**, with Minecraft 26.2 as a selectable fallback. Unlike the old Browsercraft 1.2.5 demo, **the Gaius port does not have a built-in three-minute timer**.

## Open / host

1. Open `index.html` in Chrome or Chromium on a desktop. No npm, server, Minecraft installation, or other setup is needed for **this website page**.
2. Select Java 26.3 (default), and wait for the remote Gaius game to load inside the page.
3. If embedding is blocked or broken, select **Play in full tab** to open the full actual Gaius runtime. This is the preferred way to play, because browser storage is more reliable in a first-party tab.
4. To publish your own page, upload `index.html` and `favicon.svg` to a static web host (GitHub Pages, Netlify, etc.). This website is not automatically published or hosted by this ZIP.

## Important distinctions

- **The real game runs on Gaius's externally hosted web page.** This package contains our site design and integration **only**; it is not a locally bundled / self-hosted copy of Minecraft or a freshly authored Minecraft engine. Do not remove that explanation when sharing.
- The game is experimental, with compatibility issues, bugs, and some missing game functionality. The 26.3 build has known rendering/world-generation issues, and some abilities do not work.
- The Gaius 26.3 release works best in Google Chrome / Chromium on desktop. Mobile Safari / iPhone support is not verified.
- Gaius stores worlds in the browser (IndexedDB/OPFS as supported). Third-party iframe storage may be partitioned separately from a direct tab, and clearing browser storage can delete worlds. Separate versions have separate saved world stores.
- **Unlimited session time** refers to the absence of an imposed three-minute demo timer, not a guarantee of bug-free or uninterrupted uptime.
- Minecraft is a game owned by Mojang Studios / Microsoft. This unofficial website is not endorsed by or affiliated with them. Gaius is a third-party experimental port; obey the applicable Minecraft terms and licensing rules. This package does not redistribute Mojang game client assets.

Gaius upstream: https://github.com/TypeThe0ry/Gaius

Direct 26.3 runtime: https://typethe0ry.github.io/Gaius/Gaius-26.3.html

Direct 26.2 runtime: https://typethe0ry.github.io/Gaius/Gaius-26.2.html