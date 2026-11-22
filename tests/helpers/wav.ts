// Minimal PCM WAV reader for tests (16/24-bit, any channel count). Test helper only.
import { readFileSync } from "node:fs";

export interface Wav {
  sampleRate: number;
  channels: Float32Array[];
}

export function readWav(path: string): Wav {
  const b = readFileSync(path);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE") throw new Error(`${path}: not a WAV`);
  let pos = 12;
  let fmt: { ch: number; rate: number; bits: number } | null = null;
  while (pos + 8 <= b.length) {
    const id = b.toString("ascii", pos, pos + 4);
    const size = b.readUInt32LE(pos + 4);
    const body = pos + 8;
    if (id === "fmt ") {
      if (b.readUInt16LE(body) !== 1 && b.readUInt16LE(body) !== 0xfffe) throw new Error(`${path}: not PCM`);
      fmt = { ch: b.readUInt16LE(body + 2), rate: b.readUInt32LE(body + 4), bits: b.readUInt16LE(body + 14) };
    } else if (id === "data") {
      if (!fmt) throw new Error(`${path}: data before fmt`);
      const bytes = fmt.bits / 8;
      if (bytes !== 2 && bytes !== 3) throw new Error(`${path}: ${fmt.bits}-bit unsupported`);
      const end = Math.min(body + size, b.length);
      const frames = Math.floor((end - body) / (bytes * fmt.ch));
      const channels = Array.from({ length: fmt.ch }, () => new Float32Array(frames));
      for (let n = 0; n < frames; n++) {
        for (let c = 0; c < fmt.ch; c++) {
          const o = body + (n * fmt.ch + c) * bytes;
          const v = bytes === 2 ? b.readInt16LE(o) / 32768 : b.readIntLE(o, 3) / 8388608;
          (channels[c] as Float32Array)[n] = v;
        }
      }
      return { sampleRate: fmt.rate, channels };
    }
    pos = body + size + (size & 1);
  }
  throw new Error(`${path}: no data chunk`);
}
