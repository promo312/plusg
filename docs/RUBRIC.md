# PlusG rubric (v0 draft)

Total = sum of five category marks, rounded to an integer 0-100. A category mark never exceeds its weight. Every mark shows the measured number it came from. All measurements are made in the browser.

| Category | Weight | Measured number |
|---|---|---|
| Loudness and peak | 25 | Integrated LUFS vs -14 target, true peak vs -1.0 dBTP, clipped sample count |
| Clean start and end | 15 | Leading and trailing silence in seconds |
| Lyric completeness and sync | 25 | Line count, cue coverage percent, monotonic cue times |
| Metadata readiness | 15 | Title, artist, writers present (out of 3) |
| Length and ending | 20 | Duration in range (90 s to 360 s), last 500 ms level and trailing silence |

"Length and ending" replaces the suggested "Length and structure". Reason: section detection is not reliable without a music-analysis engine, and each mark must come from a measured number. See `.kiro/specs/score-rubric/requirements.md`.

Thresholds are in that spec and are finalized here in task T4.
