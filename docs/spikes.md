# Spikes

Record each spike: question, what it taught, how the spec changed.

## T3: meter accuracy and cost (2026-11-21)

- **Question:** can a plain-TypeScript meter match ffmpeg `ebur128` within 0.1 LU and 0.3 dB true peak?
- **Result:** yes on all nine fixtures. Integrated loudness differs by 0.000 to 0.006 LU (ffmpeg's metadata prints 3 decimals). True peak differs by at most 0.046 dB (mono). The 4x interpolator is our own 24-tap Kaiser-windowed sinc per phase, not the Annex 2 table, and is within tolerance.
- **ffmpeg quirks:** the `ebur128` summary is rounded to 0.1, so the oracle also stores 3-decimal values from the metadata output. For the steady clipped tone ffmpeg reports a loudness range of 20.0 LU (histogram saturation); the JS meter reports 0. The test skips LRA for that fixture. LRA is not a requirement.
- **Cost:** `analyze` on 5 min of 44.1 kHz stereo takes about 2.8 s in Node. Not measured on a phone.
- **Spec change:** clipped sample threshold is 32767/32768, not 1.0.

