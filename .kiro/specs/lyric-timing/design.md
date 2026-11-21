# Lyric timing design

`src/shared/lyrics.ts` (T6): `parseLyrics(text) -> Line[]`, `recordTap(cues, lineIndex, timeSec)`, `nudge(cues, i, deltaSec)`, `normalizeCues(cues, duration)`. `normalizeCues` is the single place that guarantees R-LYR-3; every edit passes through it. Cue file format: `{ "version": 1, "cues": [{ "timeSec": number, "text": string }] }`.
