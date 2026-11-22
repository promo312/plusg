# PlusG design

## Stack decision
| Choice | Why | Cost to undo |
|---|---|---|
| TypeScript, one npm package | One language for shared logic, UI and tests | Low |
| Vite + React static SPA (`web/`) | Mundane, builds to static files, works on phones | Low |
| Web Audio `decodeAudioData` | Decodes WAV and MP3 in every modern browser | Low |
| JS meter in `src/shared/audio/` | BS.1770-4 K-weighting, gating and true peak in plain JS; no server | Medium (the oracle test guards it) |
| Canvas + MediaRecorder | Preview drawing and WebM clip export without a server | Low |
| GitHub Actions to GitHub Pages | Free, no card; static files only | Low |
| Vitest + fast-check | TS native, property tests | Low |

No choice is expensive to undo, so we proceed without waiting for agreement.

Rejected: any server (a server-based first pass was built and thrown away, see `docs/kiro-log.md`). ffmpeg.wasm (large download). Paid mastering or alignment APIs.

## Layout
```
.kiro/            steering, specs, hooks, agents, settings/mcp.json
src/shared/       pure logic: rubric, score, audio math, lyrics, cdg encode/decode
  audio/          loudness (BS.1770-4), true peak, clipping, silence, fixes
web/              Vite + React app, canvas previews, exports
tests/unit, tests/property
fixtures/         generated audio (ffmpeg) and lyric/cue files
tools/mcp-audio/  dev-only stdio MCP: probe_audio, measure_loudness (ffmpeg oracle)
tools/make-fixtures.sh   dev-only, added in T2: generates fixtures with ffmpeg
docs/             RUBRIC.md, spikes.md, kiro-log.md, HOW_WE_USED_KIRO.md (T14)
.github/workflows/pages.yml
```

## Measure
1. `decodeAudioData` gives channel data. A pure function `analyze(channels, sampleRate)` returns `Analysis`: integrated LUFS (two-stage K-weighting biquads, 400 ms blocks at 75% overlap, absolute gate -70 LUFS, relative gate -10 LU), true peak (4x oversampled, per BS.1770-4 Annex 2), clipped sample count (|x| >= 32767/32768, 16-bit positive full scale, since a 16-bit decode never reaches exactly 1.0), duration, leading and trailing silence (a sample is silent at or below -50 dBFS on every channel; an all-silent track has leading = duration and trailing = 0), the ending level (RMS in dBFS over the last 500 ms, all channels; -Infinity if silent), and loudness range (3 s windows, gates -70 LUFS and -20 LU, 10th to 95th percentile; informational). K-weighting coefficients are derived for any sample rate by bilinear transform (ffmpeg ebur128 prototype parameters). Channels all have weight 1.0 (correct for mono and stereo). Code: `src/shared/audio/` (`kweight`, `loudness`, `truepeak`, `levels`, `analyze`).
2. `scoreTrack(analysis, lyrics, credits)` returns a total plus five categories `{ id, name, weight, mark, reason, measured }`. `measured` is the number the mark came from, shown in the UI.
3. Oracle: `tools/make-fixtures.sh` generates fixtures with ffmpeg and stores ffmpeg `ebur128` results beside each (`*.oracle.json`). A unit test compares `analyze` to them. Tolerance 0.1 LU.
   Fixtures: good, bad, cut, silence, clipped, mono, sr44, sr48, sample. Oracle JSON keys: `integratedLufs`, `loudnessRangeLu`, `truePeakDbtp`, `sampleRate`, `channels`, `durationSec`, plus `integratedLufsPrecise` and `truePeakDbtpPrecise` (3 decimals, from the final `ebur128` metadata frame; the summary values are rounded to 0.1, which makes a 0.1 LU check unreliable). The oracle test compares against the precise keys. Digital silence: ffmpeg reports integrated -70.0 LUFS (the gate floor) and true peak -inf. The oracle stores `-70` and `null`. The meter must return the -70 floor and a true peak of `-Infinity` (shown as "no signal"). `bad` has trailing silence after a hard cut. `cut` ends mid-signal with no trailing silence, because one file cannot have both.
   Cue file: `{ "file": string, "lines": [{ "startMs": int >= 0, "text": string }] }`, `startMs` strictly increasing.

## Load and sheet (T5)
- Limits: 100 MB file size, 10 minutes of audio (about 210 MB of decoded stereo 44.1 kHz floats, the most a phone is likely to hold). Both are constants in `src/shared/load.ts`, which also holds the pure helpers (number formatting with "no signal" for -Infinity, WAV header sample rate, error mapping to plain messages). Tests: `tests/unit/load.test.ts`.
- Decode: `decodeAudioData` on an `OfflineAudioContext` created at the file's own sample rate (read from the WAV header; 44.1 kHz for MP3), so a WAV is not resampled before measuring. Channels are copied and transferred to a module Web Worker (`web/analyze.worker.ts`) that runs `analyze`. The UI shows a busy state while it runs. `analyze` is one synchronous call, so there is no percentage.
- Sample: `fixtures/sample.wav`, `sample.cues.json` and `sample.lyrics.txt` are imported with Vite `?url`, so the build emits them as relative-URL assets (inlining off) and the app fetches them from its own origin. No other request is made.
- Credits (title, artist, writers) are three text fields. Editing them rescores immediately (pure). The sample pre-fills them with demo values.
- A failed load never replaces the current sheet.

## Fix
Fixes are parameters applied to the decoded original: `{ trimStartSec, trimEndSec, gainDb }`. Applying a fix renders a new buffer, runs `analyze` on it, and scores from the new measurement. Revert drops the parameters. Loudness gain = min(target - measured, ceiling - truePeak). If the result is below the target, the UI says the target is not reachable by gain alone and shows the loudness reached. Fixed audio can be downloaded as WAV.

## Lyrics
Tap-along: audio plays, the artist taps once per line, each line can be nudged by 50 ms steps. The sample ships with `fixtures/sample.cues.json`. Automatic alignment is a stretch task.

## Release
- `src/shared/cdg/encode.ts` turns cues into a 24-byte packet stream at 300 packets per second. `decode.ts` is a minimal CD+G interpreter that rebuilds the 300 x 216 screen. The canvas preview runs the decoder over the same bytes that are downloaded as `.cdg` (P7).
- The modern preview draws the same cue list with clean type.
- One-sheet: HTML built from a pure template function (so tests can assert fields, P5). PDF is produced from the same HTML in the browser (spike in T11).
- Clip: canvas `captureStream` plus audio from an `AudioContext` destination, recorded with MediaRecorder.

## Open questions
- PDF without a server: print stylesheet plus `window.print()`, or a small pure-JS PDF writer. Decide in T11 and log in `docs/spikes.md`.
- Cost of 4x oversampled true peak on long tracks on phones. Measured in T3: `analyze` takes about 2.8 s in Node for 5 minutes of 44.1 kHz stereo (see `docs/spikes.md`). Phone timing is still unmeasured; T5 should run the analysis off the main thread or show progress.

## Deploy
`.github/workflows/pages.yml` runs `npm run check`, builds `dist/`, and publishes to GitHub Pages. Vite `base` is `./`.
