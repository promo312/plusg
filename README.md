# PlusG

**Measure. Fix. Release.** PlusG resurrects CD+G (Compact Disc plus Graphics, 1985), the dead format for timed lyric graphics, as a working tool for independent musicians. Choose a finished song, get a release-readiness score out of 100, apply safe fixes, then preview timed lyrics, download a real `.cdg` file and export a one-sheet and a short clip.

Built for Kiroween 2026, Resurrection category. Inspired by Vrenvo's public "Measure. Fix. Release." idea. This is a new codebase and uses no Vrenvo code or data.

- Live demo: https://promo312.github.io/plusg/ (static, GitHub Pages)
- **License:** MIT

## How it runs

Static files only. Audio is decoded with Web Audio and measured in JavaScript (ITU-R BS.1770-4 loudness, true peak, clipping, silence). Previews are drawn on canvas, the retro preview by decoding the same CD+G packet stream you download. Clips are recorded with MediaRecorder. There is no server and no network call after the page loads. FFmpeg is a development tool only: it generates fixtures and acts as the reference the JavaScript meter must match within 0.1 LU.

## Status

Done: scaffold, specs, steering, hooks, agents, MCP, test runner, Pages deploy (live at https://promo312.github.io/plusg/), generated audio fixtures with ffmpeg oracle files, the JS meter (checked against the oracle), the score, and the load and sheet UI (T0 to T5). Not built yet: lyric tap-along, fixes, CD+G encoder and decoder, previews, one-sheet and clip export. Features are tracked in [.kiro/specs/plusg/tasks.md](.kiro/specs/plusg/tasks.md).

## Run locally

Requires Node 20+. FFmpeg is needed only to regenerate fixtures or use the MCP.

```bash
npm install
npm run dev       # Vite dev server
npm run build     # static site in dist/
npm run preview   # serve dist/
npm run fixtures  # regenerate fixtures/ (needs ffmpeg)
```

## Test

```bash
npm test          # unit + property tests
npm run check     # lint + typecheck + tests
```

## Rubric

Five categories, weights 25/15/25/15/20: Loudness and peak, Clean start and end, Lyric completeness and sync, Metadata readiness, Length and ending. Total is an integer 0-100. See [docs/RUBRIC.md](docs/RUBRIC.md). The UI shows the same table.

## Deploy

`.github/workflows/pages.yml` builds and publishes `dist/` to GitHub Pages (free, no card). One-time setup: repo Settings, Pages, Source = GitHub Actions.

## Kiro

Specs, steering, hooks, custom agents and an MCP server live in [.kiro/](.kiro). The MCP server (`tools/mcp-audio`, development only) exposes ffprobe and ffmpeg `ebur128` for inspecting fixtures. Session history: [docs/kiro-log.md](docs/kiro-log.md).

## Demo audio

Generated with ffmpeg (tones, noise, silence, clipped tone). See [fixtures/README.md](fixtures/README.md).
