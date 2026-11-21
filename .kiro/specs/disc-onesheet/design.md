# CD+G stream, previews and one-sheet design

Modules: `src/shared/cdg/{constants,font,encode,decode}.ts`. `font.ts` is a small original bitmap font drawn into 6 x 12 tiles. `encode(cues, durationSec) -> Uint8Array` writes color-table and preset packets at the start, places each line's tile-block packets just before its cue time, and pads with 0x00 packets to 300 per second. Parity bytes follow the CD+G format (Reed-Solomon P and Q). The decoder ignores them, and this is documented. `decode(bytes, uptoPacket) -> Uint8Array` (300 x 216 palette indices) is what the canvas draws, one `ImageData` per frame.

`web/preview/RetroCanvas.tsx` and `ModernLyrics.tsx` consume `Cue[]` and a playhead. `src/shared/onesheet.ts` builds the HTML so tests can assert fields (P5). Clip export captures the canvas with `captureStream` and records with MediaRecorder.
