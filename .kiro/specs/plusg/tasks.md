# PlusG tasks

`[x]` done, `[ ]` open. Spec-first: update the spec before behavior.

- [x] T0 Steering, root spec, LICENSE, README, `.gitignore` keeping `.kiro`, hooks, agents, MCP, scaffold, test runner
- [x] T0b Rework to a static, browser-only design (server code, Dockerfile, server deps removed); GitHub Pages workflow; `docs/kiro-log.md`
- [x] T1 Enable GitHub Pages and publish the placeholder; put the live URL in the README. (R4.2)
- [x] T2 Fixtures: `tools/make-fixtures.sh` generates with ffmpeg a good track (tones and noise near -14 LUFS), a bad track (quiet, clipped tone, long leading and trailing silence, cut tail) and a sample track with `sample.cues.json` and lyrics; `*.oracle.json` from ffmpeg `ebur128`; `fixtures/README.md`. (R4.3)
- [x] T3 Meter: `src/shared/audio/` loudness (BS.1770-4), true peak, clipping, silence, ending level. Oracle test within 0.1 LU and 0.3 dB true peak on all fixtures (G2). (R1.1, R1.2)
- [x] T4 Score: `scoreTrack()` per `../score-rubric`; finalize `docs/RUBRIC.md`; P1, P2. (R1.3, R1.4)
- [ ] T5 Load and sheet UI: file picker, sample button, decode, rubric panel, measured numbers, error handling. (R1.4-R1.7, R4.1)
- [ ] T6 Lyrics and tap-along: parse, tap recording, nudge, normalization; P3. (R2.7)
- [ ] T7 Fixes: trim, loudness gain with headroom cap, re-measure, revert, recommendations; P4, P6. (R2.1-R2.8)
- [ ] T8 CD+G encoder and decoder: packets, color table, tile blocks, presets; P7, P8. (R3.1, R3.2)
- [ ] T9 `.cdg` download beside the audio; retro canvas preview driven by the decoder. (R3.1, R3.2, R3.6)
- [ ] T10 Modern lyric preview from the same cues. (R3.3)
- [ ] T11 One-sheet HTML and PDF; P5. (R3.4)
- [ ] T12 Clip export with MediaRecorder. (R3.5)
- [ ] T13 Phone pass, accessibility pass, no-network check, no-third-party-marks check. (R3.7, R4.1, R4.2)
- [ ] T14 `docs/HOW_WE_USED_KIRO.md` for Devpost.
- [ ] T15 Stretch: automatic lyric alignment.
