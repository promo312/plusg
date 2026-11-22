import { measureLoudness } from "./loudness.ts";
import { countClipped, endingLevelDbfs, measureSilence, samplePeakLinear } from "./levels.ts";
import { linearToDb, truePeakLinear } from "./truepeak.ts";

export interface Analysis {
  sampleRate: number;
  channels: number;
  durationSec: number;
  /** LUFS; -70 floor when nothing passes the absolute gate. */
  integratedLufs: number;
  loudnessRangeLu: number;
  /** dBTP; -Infinity for digital silence. */
  truePeakDbtp: number;
  /** dBFS; -Infinity for digital silence. */
  samplePeakDbfs: number;
  clippedSamples: number;
  leadingSilenceSec: number;
  trailingSilenceSec: number;
  /** RMS dBFS of the last 500 ms; -Infinity if silent. */
  endingLevelDbfs: number;
}

/** Pure measurement of decoded audio. Channels must have equal length. */
export function analyze(channels: Float32Array[], sampleRate: number): Analysis {
  const length = channels[0]?.length ?? 0;
  const { integratedLufs, loudnessRangeLu } = measureLoudness(channels, sampleRate);
  return {
    sampleRate,
    channels: channels.length,
    durationSec: length / sampleRate,
    integratedLufs,
    loudnessRangeLu,
    truePeakDbtp: linearToDb(truePeakLinear(channels)),
    samplePeakDbfs: linearToDb(samplePeakLinear(channels)),
    clippedSamples: countClipped(channels),
    ...measureSilence(channels, sampleRate),
    endingLevelDbfs: endingLevelDbfs(channels, sampleRate),
  };
}
