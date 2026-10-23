# Minecraft Web — iPhone, iPad & Desktop (Java 26.3 experiment)

**Live site:** https://rdcoleuh.github.io/My-Project/

This repository's `gh-pages` branch provides a **mobile-friendly web app / launcher** for experimental browser Minecraft clients. It does **not** distribute Minecraft Java game code.

## On iPhone or iPad

1. Open https://rdcoleuh.github.io/My-Project/ in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Enable **Open as Web App** and tap **Add**.
4. Open Minecraft Web from the Home Screen and try the 26.3 mobile link.

The website has responsive touch-friendly navigation, a Home Screen icon, a manifest and an offline-cached **launcher shell only**. Minecraft gameplay itself remains online.

## What runs where

- **Java 26.3 mobile experiment:** https://dev.eaglercraft.com/play?version=26.3 — listed as 26.3 on a provider that advertises mobile browsers, but **we have not verified actual 26.3 gameplay on iOS**.
- **Java 26.3 desktop beta:** https://client.goldhq.net/ — its own published terms say phones and tablets are unsupported and blocked.
- **Mobile-friendly fallback:** https://dev.eaglercraft.com/play?version=1.8.8 — older Minecraft version; its provider describes touch controls on compatible devices.

External sites may disallow iframe embedding; direct launch links are the recommended approach. This website imposes no timed demo cutoff, but external beta availability, data saving and play duration cannot be guaranteed.

## Downloadable iOS Xcode project

An iOS SwiftUI + WKWebView **source project ZIP** has been generated for the user separately. It can be compiled and signed by Xcode on a Mac. It is **not** a pre-signed `.ipa`. An app wrapper does not supply or unlock 26.3 gameplay, and cross-origin game pages open in Safari.

## Licensing / disclaimer

Unofficial experimental fan launcher, not endorsed or approved by Mojang Studios, Microsoft, Eaglercraft, GoldHQ or Apple. Minecraft belongs to Mojang Studios / Microsoft. No proprietary game files or assets are distributed in this repository.
