// Sample-domain measurements: clipping, silence at the ends, ending level.
import { linearToDb } from "./truepeak.ts";

/** A 16-bit sample at positive full scale decodes to 32767/32768; it counts as clipped. */
export const CLIP_THRESHOLD = 32767 / 32768;
/** Samples at or below this magnitude (-50 dBFS) count as silence. */
export const SILENCE_THRESHOLD_DBFS = -50;
/** Window for the ending level. */
export const ENDING_WINDOW_SEC = 0.5;

export function countClipped(channels: Float32Array[]): number {
  let count = 0;
  for (const ch of channels) for (let n = 0; n < ch.length; n++) if (Math.abs(ch[n] as number) >= CLIP_THRESHOLD) count++;
  return count;
}

export function samplePeakLinear(channels: Float32Array[]): number {
  let peak = 0;
  for (const ch of channels) for (let n = 0; n < ch.length; n++) peak = Math.max(peak, Math.abs(ch[n] as number));
  return peak;
}

export interface SilenceResult {
  leadingSilenceSec: number;
  trailingSilenceSec: number;
}

/**
 * Time before the first and after the last sample louder than -50 dBFS on any channel.
 * A track with no such sample is all silence: leading = duration, trailing = 0.
 */
export function measureSilence(channels: Float32Array[], sampleRate: number): SilenceResult {
  const len = channels[0]?.length ?? 0;
  const limit = Math.pow(10, SILENCE_THRESHOLD_DBFS / 20);
  let first = -1;
  let last = -1;
  for (let n = 0; n < len && first < 0; n++) {
    for (const ch of channels) if (Math.abs(ch[n] as number) > limit) { first = n; break; }
  }
  if (first < 0) return { leadingSilenceSec: len / sampleRate, trailingSilenceSec: 0 };
  for (let n = len - 1; n >= first && last < 0; n--) {
    for (const ch of channels) if (Math.abs(ch[n] as number) > limit) { last = n; break; }
  }
  return { leadingSilenceSec: first / sampleRate, trailingSilenceSec: (len - 1 - last) / sampleRate };
}

/** RMS level in dBFS over the last 500 ms (or the whole track if shorter), all channels. -Infinity if silent. */
export function endingLevelDbfs(channels: Float32Array[], sampleRate: number): number {
  const len = channels[0]?.length ?? 0;
  const count = Math.min(len, Math.round(ENDING_WINDOW_SEC * sampleRate));
  if (count === 0) return -Infinity;
  let sum = 0;
  for (const ch of channels) for (let n = len - count; n < len; n++) sum += (ch[n] as number) ** 2;
  return linearToDb(Math.sqrt(sum / (count * channels.length)));
}
