# Score rubric design

`src/shared/rubric.ts` holds weights and `composeScore`. `scoreTrack(analysis, lyrics, credits)` (T4) returns `{ total, categories: { id, name, weight, mark, reason, measured }[] }`. Pure, no I/O. The UI renders the same constants it scores with, so the displayed rubric cannot drift from the code. After a fix, the caller passes the `Analysis` of the fixed audio; `scoreTrack` never estimates.
