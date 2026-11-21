# Lyric timing spec

Method: tap-along. The song plays and the artist taps once per line.

- R-LYR-1 While the audio plays and the user taps, the system shall record the playhead time as the cue of the next lyric line.
- R-LYR-2 When the user nudges a line, the system shall move its cue by 50 ms per step and keep it between the previous and next cue.
- R-LYR-3 The cue list shall have non-negative, monotonic (non-decreasing) times that do not exceed the track duration.
- R-LYR-4 When the sample track loads, the system shall use its bundled cue file as the cue list.
- R-LYR-5 When the user pastes lyrics with `[mm:ss.xx]` stamps, the system shall import them as cues and sort them if out of order.
- R-LYR-6 When trim is applied, cue times shall shift by the trim start and stay non-negative.
- R-LYR-7 Automatic alignment is a stretch task (T15), not required.
