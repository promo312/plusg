import { analyze, type Analysis } from "../src/shared/audio/analyze";

export interface AnalyzeRequest {
  channels: Float32Array[];
  sampleRate: number;
}
export type AnalyzeResponse = { ok: true; analysis: Analysis } | { ok: false };

self.onmessage = (ev: MessageEvent<AnalyzeRequest>) => {
  let res: AnalyzeResponse;
  try {
    res = { ok: true, analysis: analyze(ev.data.channels, ev.data.sampleRate) };
  } catch {
    res = { ok: false };
  }
  (self as unknown as { postMessage(m: AnalyzeResponse): void }).postMessage(res);
};
