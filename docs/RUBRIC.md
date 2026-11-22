# PlusG rubric (v1)

Total = sum of five category marks, rounded to an integer 0-100. A category mark never exceeds its weight and never falls below 0. Every mark shows a one-line reason and the measured numbers it came from. All measurements are made in the browser. The constants below live in `src/shared/rubric.ts` (`THRESHOLDS`) and are applied in `src/shared/score.ts`.

| Category | Weight | Measured numbers |
|---|---|---|
| Loudness and peak | 25 | Integrated LUFS, true peak (dBTP), clipped sample count |
| Clean start and end | 15 | Leading and trailing silence (s) |
| Lyric completeness and sync | 25 | Line count, cue coverage (%) |
| Metadata readiness | 15 | Fields present (of 3) |
| Length and ending | 20 | Duration (s), last 500 ms level (dBFS), trailing silence (s) |

"Length and ending" replaces the suggested "Length and structure". Section detection is not reliable without a music-analysis engine, and each mark must come from a measured number. See `.kiro/specs/score-rubric/requirements.md`.

Falloffs are linear: full marks at the limit, 0 at the stated far point, straight line between.

## Loudness and peak (25)

- Loudness, 15 marks: full within +/-1 LU of -14 LUFS. Falls linearly to 0 at 9 LU away (8 LU beyond the tolerance).
- True peak, 10 marks: full at or below -1.0 dBTP. Falls linearly to 0 at +1.0 dBTP (2 dB above the ceiling).
- Clipping: any clipped sample (|sample| at 16-bit full scale) subtracts 5 marks. The category never goes below 0.
- No signal (integrated loudness at the -70 LUFS floor, or not finite): 0 marks, reason "No signal".

## Clean start and end (15)

- Leading silence, 7.5 marks: full at or below 1.5 s, 0 at 3 s or more.
- Trailing silence, 7.5 marks: full at or below 3 s, 0 at 6 s or more.
- Silence means samples at or below -50 dBFS on every channel. A fully silent file has leading silence equal to its duration.

## Lyric completeness and sync (25)

Only lines with non-blank text count.

- Presence, 5 marks: at least one line. No lines gives 0 for the whole category.
- Coverage, 12 marks: coverage is (last cue start - first cue start) divided by track duration. Full at 60% or more, linear from 0%.
- Monotonic, 8 marks: all cue times finite, at least 0 and non-decreasing. If not, these 8 marks and the coverage marks are lost (coverage counts as 0).

## Metadata readiness (15)

Title, artist and writers are 5 marks each. A field counts when it has non-blank text.

## Length and ending (20)

- Duration, 10 marks: full from 90 s to 360 s. Below 90 s: 10 x duration / 90. Above 360 s: falls linearly to 0 at 720 s.
- Ending, 10 marks: all or nothing. Lost when the last 500 ms has RMS above -40 dBFS (cut mid-signal), when trailing silence is over 3 s, or when there is no signal. A fade to near-silence or a clean stop into short silence keeps the marks.
- The cut threshold is -40 dBFS, not -30: the `cut` fixture ends at -31.6 dBFS, which -30 would miss.

## Notes

- The generated fixtures are 3 to 8 s long (the sample is 38 s), so every one of them loses Length marks. That is expected.
- Non-finite measurements give 0 for the part they feed and show as "n/a" in the reason.
