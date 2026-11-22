# Score rubric design

`src/shared/rubric.ts` holds weights, thresholds and `composeScore`. `src/shared/score.ts` holds `scoreTrack(analysis, lyrics, credits)`, which returns `{ total, categories }`. Each category is `{ id, name, weight, mark, reason, measured: { name, value, unit }[] }`. Pure, no I/O. The UI renders the same constants it scores with, so the displayed rubric cannot drift from the code. After a fix, the caller passes the `Analysis` of the fixed audio; `scoreTrack` never estimates.

Inputs: `lyrics` is `{ lines: { startMs, text }[] } | null` (the cue file shape). `credits` is `{ title?, artist?, writers? } | null`. Non-finite measurements score 0 for the part they feed and appear as `value: null` in `measured`. A track with no signal (integrated loudness at the -70 floor) scores 0 for loudness and for the ending-level half.
