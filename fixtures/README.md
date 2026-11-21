# Fixtures

Audio fixtures are generated with ffmpeg (task T2, `tools/make-fixtures.sh`) from sine tones, noise, silence and a clipped tone. They are original and rights-cleared. No commercial recordings.

ffmpeg `ebur128` results are stored beside each file as `*.oracle.json`. The JavaScript meter must match them within 0.1 LU.
