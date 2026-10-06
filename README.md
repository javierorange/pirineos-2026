# Pyrenees MTB 2026

Interactive map of mountain-bike rides in the Pyrenees (21–26 Sep 2026) on OpenStreetMap.

**Live map:** https://javierorange.github.io/pirineos-2026/

## Local

```bash
python3 -m http.server 8765
```

Open http://localhost:8765

## Rebuild GeoJSON from FIT files

Place `.fit` files in `data/fit/`, then:

```bash
npm install
npm run build
```
