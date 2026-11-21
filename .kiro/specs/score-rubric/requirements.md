# Score rubric spec

Weights (sum 100): loudness 25, edges 15, lyrics 25, metadata 15, ending 20.

**Deviation from the suggested rubric (reason):** "Length and structure" is replaced by "Length and ending". A section read (intro, body, ending) is not reliable without a music-analysis engine, and every mark must show a number the browser actually measured. The weight stays 20.

Every category returns a numeric mark, a one-line reason and the measured number it came from.

- R-SCORE-1 The total shall be an integer from 0 to 100 for any input, including missing lyrics, missing credits and non-finite measurements.
- R-SCORE-2 Each category mark shall be capped at its weight and floored at 0.
- R-SCORE-3 The total shall equal the rounded sum of category marks.
- R-SCORE-4 Each category shall carry a one-line reason and its measured value with unit.
- R-SCORE-5 Loudness and peak (25): full marks within +/-1 LU of -14 LUFS, true peak at or below -1.0 dBTP, zero clipped samples. Marks fall linearly with distance from the target; clipped samples subtract a fixed penalty. Measured: LUFS, dBTP, clipped count.
- R-SCORE-6 Clean start and end (15): full marks when leading silence is at most 1.5 s and trailing silence at most 3 s. Measured: both durations.
- R-SCORE-7 Lyric completeness and sync (25): presence, share of the track duration covered by cues, monotonic cue times. Measured: line count, cue coverage percent.
- R-SCORE-8 Metadata readiness (15): title, artist and writers count equally. Measured: fields present out of 3.
- R-SCORE-9 Length and ending (20): half the weight for duration inside 90 s to 360 s; half for the last 500 ms being neither cut mid-signal (RMS above -30 dBFS at the end of the file) nor followed by more than 3 s of silence. No section detection. Measured: duration and last-500 ms level.

Exact thresholds are finalized in `docs/RUBRIC.md` in T4.
