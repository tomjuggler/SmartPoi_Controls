# SmartPoi Controls

A Cordova-based control application for Smart Poi LED performance devices. Upload images, generate text-to-LED renders, and manage up to 8 POIs simultaneously in Router Mode.

---

## Platforms

| Platform   | Status       |
|------------|-------------|
| Android    | ✅ Stable   |
| Linux      | ✅ Stable   |
| Windows    | 🧪 Experimental |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Cordova CLI](https://cordova.apache.org/) (`npm install -g cordova`)

### Install

```bash
git clone https://github.com/circusscientist/SmartPoi_Controls.git
cd SmartPoi_Controls
npm install
```

### Build

```bash
# Android
cordova platform add android
cordova build android

# Electron (Linux & Windows)
cordova platform add electron
cordova build electron
```

### Run (with live-reload on device)

```bash
cordova run android
cordova run electron
```

---

## Features

- **Image Management** — Upload, delete, and reorder images on each POI via drag-and-drop
- **Text to POI** — Render custom text as LED-compatible images with font and colour controls
- **Smart Magic Bridge** — Direct `.zip` upload with timings for synchronised light shows
- **Multi-POI Router Mode** — Control up to 8 POIs simultaneously over a local network
- **Network Discovery** — Auto-scan your subnet to find connected POIs

---

## Links

- 🏪 **Play Store (stable)** — [SmartPoi Controls on Google Play](https://play.google.com/store/apps/details?id=com.circusscientist.smartpoicontrols)
- 🌐 **Website** — [circusscientist.com](https://circusscientist.com)
- ❤️ **Patreon** — [Support development](https://patreon.com/c/circusscientist)

---

## License

Apache-2.0 · © Circus Scientist