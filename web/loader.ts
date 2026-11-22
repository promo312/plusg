import type { Analysis } from "../src/shared/audio/analyze";
import { LoadError, checkDecoded, checkFileBeforeDecode, wavSampleRate } from "../src/shared/load";
import type { LyricsInput } from "../src/shared/score";
import type { AnalyzeRequest, AnalyzeResponse } from "./analyze.worker";
import sampleWavUrl from "../fixtures/sample.wav?url";
import sampleCuesUrl from "../fixtures/sample.cues.json?url";
import sampleLyricsUrl from "../fixtures/sample.lyrics.txt?url";

export interface Loaded {
  name: string;
  analysis: Analysis;
  lyrics: LyricsInput | null;
}

async function decode(bytes: ArrayBuffer): Promise<{ channels: Float32Array[]; sampleRate: number }> {
  const rate = Math.min(96000, Math.max(8000, wavSampleRate(new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 4096))) ?? 44100));
  let buffer: AudioBuffer;
  try {
    buffer = await new OfflineAudioContext(1, 1, rate).decodeAudioData(bytes);
  } catch {
    throw new LoadError("undecodable");
  }
  const channels: Float32Array[] = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i).slice());
  return { channels, sampleRate: buffer.sampleRate };
}

function analyzeInWorker(channels: Float32Array[], sampleRate: number): Promise<Analysis> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./analyze.worker.ts", import.meta.url), { type: "module" });
    const done = (fn: () => void) => {
      worker.terminate();
      fn();
    };
    worker.onmessage = (ev: MessageEvent<AnalyzeResponse>) =>
      done(() => (ev.data.ok ? resolve(ev.data.analysis) : reject(new LoadError("unknown"))));
    worker.onerror = () => done(() => reject(new LoadError("unknown")));
    const req: AnalyzeRequest = { channels, sampleRate };
    worker.postMessage(req, channels.map((c) => c.buffer));
  });
}

async function measure(bytes: ArrayBuffer): Promise<Analysis> {
  const { channels, sampleRate } = await decode(bytes);
  const bad = checkDecoded(channels, sampleRate);
  if (bad) throw new LoadError(bad);
  return analyzeInWorker(channels, sampleRate);
}

export async function loadFile(file: File): Promise<Loaded> {
  const bad = checkFileBeforeDecode(file);
  if (bad) throw new LoadError(bad);
  return { name: file.name, analysis: await measure(await file.arrayBuffer()), lyrics: null };
}

export async function loadSample(): Promise<Loaded> {
  const get = async (url: string) => {
    const r = await fetch(url);
    if (!r.ok) throw new LoadError("unknown");
    return r;
  };
  const [wav, cues] = await Promise.all([get(sampleWavUrl), get(sampleCuesUrl)]);
  void sampleLyricsUrl; // shipped beside the cues; the lyric UI (T6) reads it
  const lyrics = (await cues.json()) as LyricsInput;
  return { name: "sample.wav", analysis: await measure(await wav.arrayBuffer()), lyrics };
}
