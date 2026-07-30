# ⚡ ScoreSkor

Simple PWA score keeper for 2–8 players. Tap to add/subtract points. No accounts, no servers — everything lives in your browser.

**Live**: [iesta.github.io/ScoreSkor](https://iesta.github.io/ScoreSkor/)

## Features

- **2–8 players** — setup screen with keyboard Enter support
- **Score grid** — single tap opens ±1/±5 buttons, double tap renames a player
- **Dark navy theme** — vibrante hot pink + cyan, pops on mobile
- **8 fonts** — Henny Penny, Luckiest Guy, Anta, Erica One, Aldrich, Quicksand, Google Sans, Elms Sans
- **Horizontal view** — toggle in prefs: stack vertically instead of 2 columns
- **Subtle sound** — different tones for ±1 and ±5 (toggleable)
- **Reset** — zero all scores, keep names
- **Menu** — hamburger top-right: New Score, Reset, Preferences, Install, About
- **PWA** — install to home screen, works offline, no URL bar

## Privacy

All data stored in **localStorage only**. Nothing leaves your device. No analytics, no tracking, no backend.

## Tech

Vanilla HTML/CSS/JS. Zero dependencies. Zero build step.

```
scoreskor/
├── index.html
├── manifest.json
├── sw.js
├── css/style.css
├── js/
│   ├── app.js
│   ├── storage.js
│   └── sound.js
└── icons/
```

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy

Static files. Push to GitHub → enable Pages → done.

## License

MIT