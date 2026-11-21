---
inclusion: fileMatch
fileMatchPattern: "{src/shared/**,tools/**,fixtures/**}"
---
# Audio and loudness rules
- Streaming loudness target: **-14 LUFS integrated**. The JS meter follows ITU-R BS.1770-4 / EBU R128 (K-weighting, 400 ms blocks, -70 LUFS absolute gate, -10 LU relative gate). True peak ceiling: **-1.0 dBTP**, measured with 4x oversampling.
- The JS meter must match ffmpeg `ebur128` within **0.1 LU** on every fixture. ffmpeg is the oracle, never a runtime dependency.
- A sample at full scale (|x| >= 1.0 after decode) counts as clipped.
- Loudness fix: gain = min(target - measured, ceiling - true peak). If the target is out of reach, say so and report the loudness reached. Always re-measure the fixed audio and score from that measurement.
- Silence trim must never cut into the first onset; keep a safety margin. Fixes are parameters on the untouched original and are always reversible.
- Fixtures are generated with ffmpeg (tones, noise, silence, clipped tone). No commercial recordings.
- Never guess measurements. Inspect fixtures with the `plusg-audio` MCP tools.
