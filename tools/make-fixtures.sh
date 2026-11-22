#!/usr/bin/env bash
# Generates every audio fixture and its ffmpeg ebur128 oracle into fixtures/.
# Development tool only. Needs ffmpeg and ffprobe. Deterministic: fixed noise seeds,
# bitexact output, no metadata. Never called from app code.
set -euo pipefail

cd "$(dirname "$0")/.."
OUT=fixtures
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
FF=(ffmpeg -hide_banner -loglevel error -y -fflags +bitexact -flags +bitexact)

# measure <wav> -> prints "I LRA PEAK" (PEAK may be -inf)
measure() {
  ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 |
    awk '/Summary:/{s=1} s&&/^ +I:/{i=$2} s&&/LRA:/{l=$2} s&&/Peak:/{p=$2} END{print i, l, p}'
}

# render <out.wav> <ffmpeg args...>: 16-bit PCM WAV without metadata
render() {
  local out=$1; shift
  "${FF[@]}" "$@" -map_metadata -1 -c:a pcm_s16le "$out"
}

# gain_to <in.wav> <out.wav> <target LUFS>: linear gain so integrated loudness hits the target
gain_to() {
  local in=$1 out=$2 target=$3 m g
  m=$(measure "$in"); m=${m%% *}
  g=$(awk -v t="$target" -v i="$m" 'BEGIN{printf "%.3f", t-i}')
  "${FF[@]}" -i "$in" -af "volume=${g}dB" -map_metadata -1 -c:a pcm_s16le "$out"
}

# oracle <name>: writes fixtures/<name>.oracle.json from ebur128 + ffprobe
oracle() {
  local f="$OUT/$1.wav" m i lra peak sr ch dur
  m=$(measure "$f"); read -r i lra peak <<<"$m"
  sr=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of csv=p=0 "$f")
  ch=$(ffprobe -v error -select_streams a:0 -show_entries stream=channels -of csv=p=0 "$f")
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  [ "$peak" = "-inf" ] && peak=null
  cat >"$OUT/$1.oracle.json" <<EOF
{
  "file": "$1.wav",
  "source": "ffmpeg ebur128=peak=true",
  "integratedLufs": $i,
  "loudnessRangeLu": $lra,
  "truePeakDbtp": $peak,
  "sampleRate": $sr,
  "channels": $ch,
  "durationSec": $dur
}
EOF
}

mkdir -p "$OUT"

# good: A minor chord tones plus low pink noise, stereo 48 kHz, 8 s, normalized to -14 LUFS.
render "$TMP/good.raw.wav" \
  -f lavfi -i "sine=f=220:r=48000:d=8" -f lavfi -i "sine=f=261.63:r=48000:d=8" \
  -f lavfi -i "sine=f=329.63:r=48000:d=8" -f lavfi -i "anoisesrc=c=pink:r=48000:a=0.05:seed=11:d=8" \
  -filter_complex "[0][1][2][3]amix=inputs=4:normalize=0,volume=0.4,afade=t=in:d=0.3,afade=t=out:st=7.5:d=0.5,aformat=channel_layouts=stereo" \
  -ar 48000 -ac 2
gain_to "$TMP/good.raw.wav" "$OUT/good.wav" -14

# bad: 44.1 kHz stereo, quiet. 2 s silence, quiet tones, a 5 ms hard-clipped burst, a hard cut to 2 s of silence.
render "$TMP/bad.body.wav" \
  -f lavfi -i "sine=f=196:r=44100:d=3.5" -f lavfi -i "sine=f=246.94:r=44100:d=3.5" \
  -f lavfi -i "anoisesrc=c=white:r=44100:a=0.02:seed=22:d=3.5" \
  -filter_complex "[0][1][2]amix=inputs=3:normalize=0,volume=0.5,aformat=channel_layouts=stereo" -ar 44100 -ac 2
gain_to "$TMP/bad.body.wav" "$TMP/bad.quiet.wav" -26
render "$TMP/bad.clip.wav" -f lavfi -i "sine=f=1000:r=44100:d=0.005" \
  -af "aeval='clip(val(0)*40,-1,1)|clip(val(0)*40,-1,1)':c=stereo" -ar 44100 -ac 2
render "$OUT/bad.wav" \
  -f lavfi -i "anullsrc=r=44100:cl=stereo:d=2" -i "$TMP/bad.quiet.wav" -i "$TMP/bad.clip.wav" \
  -f lavfi -i "anullsrc=r=44100:cl=stereo:d=2" \
  -filter_complex "[0][1][2][3]concat=n=4:v=0:a=1" -ar 44100 -ac 2

# cut: companion to bad. Same quiet tones, but the file ends mid-signal with no fade and no trailing silence.
render "$OUT/cut.wav" \
  -f lavfi -i "sine=f=196:r=44100:d=4" -f lavfi -i "sine=f=246.94:r=44100:d=4" \
  -filter_complex "[0][1]amix=inputs=2:normalize=0,volume=0.3,aformat=channel_layouts=stereo" -ar 44100 -ac 2

# silence: digital silence, stereo 48 kHz, 5 s.
render "$OUT/silence.wav" -f lavfi -i "anullsrc=r=48000:cl=stereo:d=5" -ar 48000 -ac 2

# clipped: 440 Hz sine driven 40x (sine amplitude is 0.125) into hard clipping, full scale, stereo 48 kHz, 3 s.
render "$OUT/clipped.wav" -f lavfi -i "sine=f=440:r=48000:d=3" \
  -af "aeval='clip(val(0)*40,-1,1)|clip(val(0)*40,-1,1)':c=stereo" -ar 48000 -ac 2

# mono: tone plus white noise, 1 channel, 48 kHz, 6 s, about -18 LUFS.
render "$TMP/mono.raw.wav" \
  -f lavfi -i "sine=f=330:r=48000:d=6" -f lavfi -i "anoisesrc=c=white:r=48000:a=0.03:seed=33:d=6" \
  -filter_complex "[0][1]amix=inputs=2:normalize=0,volume=0.5,afade=t=in:d=0.2,afade=t=out:st=5.5:d=0.5" -ar 48000 -ac 1
gain_to "$TMP/mono.raw.wav" "$OUT/mono.wav" -18

# sr44: 44.1 kHz stereo, D major tones with slow tremolo, 8 s, about -16 LUFS.
render "$TMP/sr44.raw.wav" \
  -f lavfi -i "sine=f=293.66:r=44100:d=8" -f lavfi -i "sine=f=369.99:r=44100:d=8" \
  -f lavfi -i "sine=f=440:r=44100:d=8" -f lavfi -i "anoisesrc=c=brown:r=44100:a=0.04:seed=44:d=8" \
  -filter_complex "[0][1][2][3]amix=inputs=4:normalize=0,tremolo=f=0.5:d=0.3,afade=t=in:d=0.3,afade=t=out:st=7.4:d=0.6,aformat=channel_layouts=stereo" -ar 44100 -ac 2
gain_to "$TMP/sr44.raw.wav" "$OUT/sr44.wav" -16

# sr48: 48 kHz stereo, E minor tones panned apart, 8 s, about -12 LUFS.
render "$TMP/sr48.raw.wav" \
  -f lavfi -i "sine=f=164.81:r=48000:d=8" -f lavfi -i "sine=f=196:r=48000:d=8" \
  -f lavfi -i "sine=f=246.94:r=48000:d=8" -f lavfi -i "anoisesrc=c=pink:r=48000:a=0.03:seed=55:d=8" \
  -filter_complex "[0][1]amix=inputs=2:normalize=0,pan=stereo|c0=c0|c1=0.4*c0[l];[2][3]amix=inputs=2:normalize=0,pan=stereo|c0=0.4*c0|c1=c0[r];[l][r]amix=inputs=2:normalize=0,afade=t=in:d=0.3,afade=t=out:st=7.4:d=0.6" -ar 48000 -ac 2
gain_to "$TMP/sr48.raw.wav" "$OUT/sr48.wav" -12

# sample: demo track. Mono 24 kHz (keeps the file near 1.8 MB). 1.5 s lead silence, eight
# 4.25 s chords (C, Am, F, G, twice) with soft attack and release, 2.5 s tail. About -19 LUFS,
# so the loudness fix has work to do. Chord starts are 1500 + 4250*n ms (see sample.cues.json).
chords=("261.63 329.63 392" "220 261.63 329.63" "174.61 220 261.63" "196 246.94 293.66")
args=(); fc=""; idx=0
for n in 0 1 2 3 4 5 6 7; do
  read -ra notes <<<"${chords[$((n % 4))]}"
  for f in "${notes[@]}"; do args+=(-f lavfi -i "sine=f=$f:r=24000:d=4.25"); done
  fc+="[$idx][$((idx+1))][$((idx+2))]amix=inputs=3:normalize=0,afade=t=in:d=0.25,afade=t=out:st=3.75:d=0.5[c$n];"
  idx=$((idx+3))
done
args+=(-f lavfi -i "anullsrc=r=24000:cl=mono:d=1.5" -f lavfi -i "anullsrc=r=24000:cl=mono:d=2.5")
fc+="[24][c0][c1][c2][c3][c4][c5][c6][c7][25]concat=n=10:v=0:a=1"
render "$TMP/sample.raw.wav" "${args[@]}" -filter_complex "$fc" -ar 24000 -ac 1
gain_to "$TMP/sample.raw.wav" "$OUT/sample.wav" -19

for n in good bad cut silence clipped mono sr44 sr48 sample; do oracle "$n"; done
echo "fixtures written to $OUT/"
