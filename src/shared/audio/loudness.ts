// Integrated loudness and loudness range (ITU-R BS.1770-4, EBU R128 / Tech 3342).
import { kWeight } from "./kweight.ts";

/** Reported when no block passes the absolute gate (ffmpeg reports the same floor). */
export const LOUDNESS_FLOOR_LUFS = -70;

const ABS_GATE = -70;
const REL_GATE_INTEGRATED = -10;
const REL_GATE_RANGE = -20;

export interface LoudnessResult {
  /** Integrated loudness in LUFS. -70 when the track has no gated block. */
  integratedLufs: number;
  /** Loudness range in LU (EBU Tech 3342). 0 when it cannot be computed. */
  loudnessRangeLu: number;
}

const toLufs = (energy: number) => -0.691 + 10 * Math.log10(energy);

/**
 * Mean-square energy per hop of `hop` samples, summed over channels (channel weight 1.0,
 * which is correct for mono and stereo). Block energies are built from these.
 */
function hopEnergies(channels: Float32Array[], sampleRate: number, hop: number): Float64Array {
  const length = channels[0]?.length ?? 0;
  const hops = Math.floor(length / hop);
  const sums = new Float64Array(hops);
  for (const ch of channels) {
    const w = kWeight(ch, sampleRate);
    for (let h = 0; h < hops; h++) {
      let s = 0;
      for (let n = h * hop, end = n + hop; n < end; n++) {
        const v = w[n] as number;
        s += v * v;
      }
      sums[h] = (sums[h] as number) + s;
    }
  }
  return sums;
}

/** Mean energy of a window of `count` hops starting at `start`, per sample. */
function windowEnergies(hopSums: Float64Array, count: number, hop: number): Float64Array {
  const n = hopSums.length - count + 1;
  if (n <= 0) return new Float64Array(0);
  const out = new Float64Array(n);
  let acc = 0;
  for (let i = 0; i < count; i++) acc += hopSums[i] as number;
  out[0] = acc / (count * hop);
  for (let i = 1; i < n; i++) {
    acc += (hopSums[i + count - 1] as number) - (hopSums[i - 1] as number);
    out[i] = acc / (count * hop);
  }
  return out;
}

function gatedMeanEnergy(energies: Float64Array, relativeGate: number): number | null {
  const loud = Array.from(energies).filter((e) => e > 0 && toLufs(e) > ABS_GATE);
  if (loud.length === 0) return null;
  const mean = loud.reduce((a, b) => a + b, 0) / loud.length;
  const threshold = toLufs(mean) + relativeGate;
  const kept = loud.filter((e) => toLufs(e) > threshold);
  if (kept.length === 0) return null;
  return kept.reduce((a, b) => a + b, 0) / kept.length;
}

/**
 * Integrated loudness: 400 ms blocks every 100 ms (75 % overlap), absolute gate -70 LUFS,
 * relative gate -10 LU. Loudness range: 3 s windows every 100 ms, absolute gate -70 LUFS,
 * relative gate -20 LU, 10th to 95th percentile.
 * `channels` are equal-length arrays; all channels get weight 1.0.
 */
export function measureLoudness(channels: Float32Array[], sampleRate: number): LoudnessResult {
  const empty = { integratedLufs: LOUDNESS_FLOOR_LUFS, loudnessRangeLu: 0 };
  if (channels.length === 0 || !(sampleRate > 0)) return empty;
  const hop = Math.round(sampleRate / 10);
  const hops = hopEnergies(channels, sampleRate, hop);

  const blocks = windowEnergies(hops, 4, hop);
  const mean = gatedMeanEnergy(blocks, REL_GATE_INTEGRATED);
  const integratedLufs = mean === null ? LOUDNESS_FLOOR_LUFS : Math.max(LOUDNESS_FLOOR_LUFS, toLufs(mean));

  const shortTerm = windowEnergies(hops, 30, hop);
  const loud = Array.from(shortTerm).filter((e) => e > 0 && toLufs(e) > ABS_GATE);
  let loudnessRangeLu = 0;
  if (loud.length > 0) {
    const gate = toLufs(loud.reduce((a, b) => a + b, 0) / loud.length) + REL_GATE_RANGE;
    const levels = loud.map(toLufs).filter((l) => l > gate).sort((a, b) => a - b);
    if (levels.length > 0) {
      const at = (p: number) => levels[Math.min(levels.length - 1, Math.floor((levels.length - 1) * p + 0.5))] as number;
      loudnessRangeLu = Math.max(0, at(0.95) - at(0.1));
    }
  }
  return { integratedLufs, loudnessRangeLu };
}
