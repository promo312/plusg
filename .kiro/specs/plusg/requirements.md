# PlusG requirements

EARS notation. IDs are referenced by tests. Focused specs: `../score-rubric`, `../lyric-timing`, `../disc-onesheet`.

**Architecture constraint:** the judged path runs entirely in the browser and is hosted as static files. There is no server. FFmpeg and ffprobe are development tools only.

## Users
Independent musician finishing a song; hackathon judge evaluating the app on a laptop or phone.

## R1 Measure
**Story:** As an artist, I want to know if my track is ready to release.
- R1.1 When the user chooses a WAV or MP3 file, the system shall decode it with Web Audio and measure, in JavaScript, integrated loudness (ITU-R BS.1770-4 / EBU R128), true peak, clipped sample count, duration, leading silence and trailing silence.
- R1.2 The JavaScript meter shall match ffmpeg `ebur128` integrated loudness within 0.1 LU and true peak within 0.3 dB on every audio fixture (digital silence: -70 LUFS and a true peak of -Infinity).
- R1.3 When the user supplies lyrics and credits (title, artist, writers), the system shall include lyric completeness, lyric timing and metadata in the score.
- R1.4 The system shall show a score that is an integer from 0 to 100 and five named categories, each with a numeric mark, a one-line reason and the measured number the mark came from.
- R1.5 The system shall display the rubric (categories, weights, thresholds) in the UI and document it in `docs/RUBRIC.md`.
- R1.6 If a file is not WAV or MP3, cannot be decoded, or exceeds 100 MB, then the system shall reject it with a plain error message and keep the previous sheet.
- R1.7 When the user chooses the preloaded sample track, the system shall run the same measurement on the bundled audio, with its finished cue file, without an upload.

## R2 Fix
**Story:** As an artist, I want concrete fixes that I can undo.
- R2.1 For each category whose mark is below its weight, the system shall show a recommendation.
- R2.2 When the user applies a silence trim, the system shall not cut into the first onset or the last audible sample.
- R2.3 When the user applies the loudness fix, the system shall apply gain = min(target - measured, ceiling - true peak), with target -14 LUFS and ceiling -1.0 dBTP.
- R2.4 If the loudness target cannot be reached by gain alone, then the system shall say so and state the loudness it reaches.
- R2.5 After any audio fix, the system shall measure the fixed audio again and compute the score from that measurement.
- R2.6 After any loudness fix, the true peak of the fixed audio shall be at or under -1.0 dBTP.
- R2.7 When the user records or edits lyric timing, the system shall keep cue times non-negative and monotonic and shall rescore immediately.
- R2.8 The system shall let the user revert each applied fix. The original audio is never overwritten.

## R3 Release
**Story:** As an artist, I want to preview and share my release.
- R3.1 The system shall encode the cue list as a CD+G packet stream and offer it as a `.cdg` download beside the audio (see `../disc-onesheet`).
- R3.2 The retro preview shall be drawn by decoding that same packet stream. The system shall have no separate renderer for it.
- R3.3 The system shall draw a clean modern lyric preview from the same cue list.
- R3.4 When the user exports a one-sheet, the system shall produce HTML and PDF containing title, artist, writers, duration, total score, and every category mark, reason and measured number.
- R3.5 When the user exports a preview clip, the system shall record the preview canvas and audio with MediaRecorder to a WebM (or MP4 where the browser supports it) file.
- R3.6 The system shall describe the retro view as an homage to CD+G and shall not claim compatibility with every legacy player.
- R3.7 The UI shall not show a Compact Disc logo or any other third-party mark.

## R4 Platform and eligibility
- R4.1 The judged path (sample, Measure, Fix, Release) shall work on a phone browser without horizontal scrolling.
- R4.2 The system shall make no network request on the judged path after the static files load, and shall use no paid API.
- R4.3 The repository shall contain only generated audio fixtures (ffmpeg tones, noise, silence, clipped tone), documented in `fixtures/README.md`. No commercial recordings.
- R4.4 The UI and docs shall be in English.

## Property tests (derived from EARS)
| ID | Property | Source |
|---|---|---|
| P1 | Score is an integer in 0-100 for any inputs | R1.4 |
| P2 | Category mark never exceeds its weight | R1.4 |
| P3 | Lyric cue times are non-negative and monotonic | R2.7 |
| P4 | Silence trim never cuts into the first onset | R2.2 |
| P5 | Exports contain all required one-sheet fields | R3.4 |
| P6 | After any loudness fix, true peak is at or under the ceiling | R2.6 |
| P7 | Decoding the encoded cues shows every line at its cue time | R3.2 |
| P8 | Every encoded packet is 24 bytes and the stream has 300 packets per second | R3.1 |
