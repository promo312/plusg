// True peak by 4x oversampling (ITU-R BS.1770-4 Annex 2). The interpolator is a Kaiser-windowed
// sinc, evaluated as three polyphase branches (the fourth phase is the sample itself).

const OVERSAMPLE = 4;
const HALF_TAPS = 12; // taps per side per phase
const KAISER_BETA = 8;

function bessel0(x: number): number {
  let sum = 1;
  let term = 1;
  for (let k = 1; k < 40; k++) {
    term *= (x / (2 * k)) ** 2;
    sum += term;
  }
  return sum;
}

function buildPhases(): Float64Array[] {
  const norm = bessel0(KAISER_BETA);
  const phases: Float64Array[] = [];
  for (let p = 1; p < OVERSAMPLE; p++) {
    const frac = p / OVERSAMPLE;
    // y(n + frac) = sum_j x[n - j] * h(j + frac), j = -(HALF_TAPS-1) .. HALF_TAPS
    const taps = new Float64Array(2 * HALF_TAPS);
    for (let i = 0; i < taps.length; i++) {
      const t = i - (HALF_TAPS - 1) + frac; // distance in input samples
      const sinc = Math.sin(Math.PI * t) / (Math.PI * t);
      const r = t / HALF_TAPS;
      const win = Math.abs(r) >= 1 ? 0 : bessel0(KAISER_BETA * Math.sqrt(1 - r * r)) / norm;
      taps[i] = sinc * win;
    }
    phases.push(taps);
  }
  return phases;
}

const PHASES = buildPhases();

/** Largest absolute value of the 4x oversampled signal of one channel, linear. */
export function truePeakLinearChannel(x: Float32Array): number {
  const len = x.length;
  let peak = 0;
  for (let n = 0; n < len; n++) {
    const a = Math.abs(x[n] as number);
    if (a > peak) peak = a;
  }
  for (const taps of PHASES) {
    for (let n = 0; n < len; n++) {
      // taps[i] pairs with x[n + (HALF_TAPS - 1) - i]
      let s = 0;
      const base = n + HALF_TAPS - 1;
      const lo = Math.max(0, base - len + 1);
      const hi = Math.min(taps.length - 1, base);
      for (let i = lo; i <= hi; i++) s += (taps[i] as number) * (x[base - i] as number);
      const a = Math.abs(s);
      if (a > peak) peak = a;
    }
  }
  return peak;
}

/** Linear true peak over all channels. */
export function truePeakLinear(channels: Float32Array[]): number {
  let peak = 0;
  for (const ch of channels) peak = Math.max(peak, truePeakLinearChannel(ch));
  return peak;
}

/** dB relative to full scale; -Infinity for digital silence. */
export const linearToDb = (v: number): number => (v > 0 ? 20 * Math.log10(v) : -Infinity);

/** True peak in dBTP. -Infinity for digital silence. */
export function truePeakDbtp(channels: Float32Array[]): number {
  return linearToDb(truePeakLinear(channels));
}
