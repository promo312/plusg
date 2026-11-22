// K-weighting per ITU-R BS.1770-4: a high-shelf pre-filter followed by the RLB high-pass.
// Coefficients are derived for any sample rate with the bilinear transform, using the
// analog prototype parameters ffmpeg's ebur128 filter uses (they reproduce the BS.1770
// table values at 48 kHz).

export interface Biquad {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/** Stage 1: high-shelf (head-related) pre-filter. */
export function preFilterCoefficients(sampleRate: number): Biquad {
  const f0 = 1681.9744509555319;
  const G = 3.999843853973347;
  const Q = 0.7071752369554196;
  const K = Math.tan((Math.PI * f0) / sampleRate);
  const Vh = Math.pow(10, G / 20);
  const Vb = Math.pow(Vh, 0.4996667741545416);
  const a0 = 1 + K / Q + K * K;
  return {
    b0: (Vh + (Vb * K) / Q + K * K) / a0,
    b1: (2 * (K * K - Vh)) / a0,
    b2: (Vh - (Vb * K) / Q + K * K) / a0,
    a1: (2 * (K * K - 1)) / a0,
    a2: (1 - K / Q + K * K) / a0,
  };
}

/** Stage 2: RLB high-pass. */
export function rlbFilterCoefficients(sampleRate: number): Biquad {
  const f0 = 38.13547087613982;
  const Q = 0.5003270373253953;
  const K = Math.tan((Math.PI * f0) / sampleRate);
  const a0 = 1 + K / Q + K * K;
  return { b0: 1, b1: -2, b2: 1, a1: (2 * (K * K - 1)) / a0, a2: (1 - K / Q + K * K) / a0 };
}

/** Runs one biquad (direct form II transposed) over `x` and returns a new array. */
export function applyBiquad(x: Float32Array | Float64Array, c: Biquad): Float64Array {
  const y = new Float64Array(x.length);
  let z1 = 0;
  let z2 = 0;
  for (let n = 0; n < x.length; n++) {
    const v = x[n] as number;
    const out = c.b0 * v + z1;
    z1 = c.b1 * v - c.a1 * out + z2;
    z2 = c.b2 * v - c.a2 * out;
    y[n] = out;
  }
  return y;
}

/** K-weights one channel. */
export function kWeight(x: Float32Array, sampleRate: number): Float64Array {
  return applyBiquad(applyBiquad(x, preFilterCoefficients(sampleRate)), rlbFilterCoefficients(sampleRate));
}
