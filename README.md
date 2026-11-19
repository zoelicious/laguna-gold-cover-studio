# Laguna Gold — Cover Art Maker

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/zoelicious/laguna-gold-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/zoelicious/laguna-gold-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your photos into a Vice City sunset-poster cover — offline, in your browser, in four steps.

**Laguna Gold** is an offline web app that turns photos + a title into poster-style cover art: a hero-dominant multi-panel layout, a giant two-word title with kicker, script tagline and pill, a retro striped sun overlay and palm silhouettes, and five canvas colour grades — Sunset, Golden Hour, Neon Night, Bright Day and Pop Art / Halftone. Export PNGs at 1080×1080, 1080×1350 and 1920×1080 in one click.

Built for the [make.fun bounty gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).

Referral: https://make.fun/r/nmy46sr8

## How it works

1. **Pick photos** — six sample photos are built in; add your own from your machine (read locally, never uploaded).
2. **Arrange panels** — layouts: Hero, 4-panel, 6-panel, 9-panel classic, Single hero. Click a panel to select it, drag it to pan, zoom with the slider.
3. **Write the title** — kicker, two-word title, tagline and pill; four lettering styles (banner, outline, neon glow, block white) and three positions.
4. **Export PNG** — one click per size, or all three sizes at once.

## Run it

```sh
cd app
python3 -m http.server 8000
# open http://localhost:8000 in desktop Chrome
```

No build step, no network request: every script, font and sample photo is a file under `app/`.

## Fonts

- Archivo Black, Oswald and Pacifico, all under the SIL Open Font License 1.1 — see `app/fonts/OFL-*.txt`.

## License

MIT — see [LICENSE](LICENSE).
