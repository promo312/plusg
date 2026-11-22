// scoreTrack: pure scoring per .kiro/specs/score-rubric. No I/O, no estimation.
import type { Analysis } from "./audio/analyze.ts";
import {
  CATEGORIES,
  LOUDNESS_TARGET_LUFS,
  THRESHOLDS as T,
  TRUE_PEAK_CEILING_DBTP,
  composeScore,
  type CategoryId,
} from "./rubric.ts";

export interface LyricLine {
  startMs: number;
  text: string;
}
export interface LyricsInput {
  lines: readonly LyricLine[];
}
export interface CreditsInput {
  title?: string;
  artist?: string;
  writers?: string;
}
export interface Measured {
  name: string;
  /** null when the measurement is missing or not finite (including -Infinity). */
  value: number | null;
  unit: string;
}
export interface CategoryScore {
  id: CategoryId;
  name: string;
  weight: number;
  mark: number;
  reason: string;
  measured: Measured[];
}
export interface TrackScore {
  total: number;
  categories: CategoryScore[];
}

const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const num = (v: number, d = 1) => (fin(v) ? v.toFixed(d) : "n/a");
const m = (name: string, v: unknown, unit: string): Measured => ({ name, value: fin(v) ? v : null, unit });
/** Linear: 1 at or below `full`, 0 at or above `zero`. Non-finite gives 0. */
const falloff = (v: number, full: number, zero: number) => (fin(v) ? clamp01(1 - (v - full) / (zero - full)) : 0);
const noSignal = (a: Analysis) => !fin(a.integratedLufs) || a.integratedLufs <= -70;

function loudness(a: Analysis): Omit<CategoryScore, "id" | "name" | "weight"> {
  const measured = [
    m("Integrated loudness", a.integratedLufs, "LUFS"),
    m("True peak", a.truePeakDbtp, "dBTP"),
    m("Clipped samples", a.clippedSamples, "samples"),
  ];
  if (noSignal(a)) return { mark: 0, reason: "No signal: nothing above the loudness gate, so loudness cannot be scored.", measured };
  const dist = Math.abs(a.integratedLufs - LOUDNESS_TARGET_LUFS);
  const lufsPart = T.loudnessLufsMarks * falloff(dist, T.loudnessToleranceLu, T.loudnessToleranceLu + T.loudnessFalloffLu);
  const tp = a.truePeakDbtp;
  const peakPart = tp === -Infinity ? T.loudnessPeakMarks : T.loudnessPeakMarks * falloff(tp, TRUE_PEAK_CEILING_DBTP, TRUE_PEAK_CEILING_DBTP + T.peakFalloffDb);
  const clipped = fin(a.clippedSamples) && a.clippedSamples > 0;
  const mark = Math.max(0, lufsPart + peakPart - (clipped ? T.clippingPenalty : 0));
  const bits = [
    `${num(a.integratedLufs)} LUFS vs ${LOUDNESS_TARGET_LUFS} target`,
    `true peak ${num(tp)} dBTP vs ${TRUE_PEAK_CEILING_DBTP} ceiling`,
    clipped ? `${a.clippedSamples} clipped samples` : "no clipped samples",
  ];
  return { mark, reason: bits.join("; ") + ".", measured };
}

function edges(a: Analysis): Omit<CategoryScore, "id" | "name" | "weight"> {
  const lead = 7.5 * falloff(a.leadingSilenceSec, T.leadingSilenceMaxSec, 2 * T.leadingSilenceMaxSec);
  const trail = 7.5 * falloff(a.trailingSilenceSec, T.trailingSilenceMaxSec, 2 * T.trailingSilenceMaxSec);
  return {
    mark: lead + trail,
    reason: `Leading silence ${num(a.leadingSilenceSec, 2)} s (limit ${T.leadingSilenceMaxSec}); trailing silence ${num(a.trailingSilenceSec, 2)} s (limit ${T.trailingSilenceMaxSec}).`,
    measured: [m("Leading silence", a.leadingSilenceSec, "s"), m("Trailing silence", a.trailingSilenceSec, "s")],
  };
}

function lyrics(a: Analysis, l: LyricsInput | null | undefined): Omit<CategoryScore, "id" | "name" | "weight"> {
  const lines = (Array.isArray(l?.lines) ? l.lines : []).filter((x) => x && typeof x.text === "string" && x.text.trim() !== "");
  const starts = lines.map((x) => x.startMs);
  const monotonic = starts.length > 0 && starts.every((s, i) => fin(s) && s >= 0 && (i === 0 || s >= (starts[i - 1] as number)));
  let coverage = 0;
  if (monotonic && fin(a.durationSec) && a.durationSec > 0) {
    coverage = clamp01(((starts[starts.length - 1] as number) - (starts[0] as number)) / 1000 / a.durationSec);
  }
  const measured = [m("Lyric lines", lines.length, "lines"), m("Cue coverage", Math.round(coverage * 1000) / 10, "%")];
  if (lines.length === 0) return { mark: 0, reason: "No lyric lines with cues.", measured };
  const mark =
    T.lyricsPresenceMarks +
    T.lyricsCoverageMarks * clamp01(coverage / T.lyricsFullCoverage) +
    (monotonic ? T.lyricsMonotonicMarks : 0);
  return {
    mark,
    reason: `${lines.length} lines cover ${num(coverage * 100)}% of the track (full marks at ${T.lyricsFullCoverage * 100}%); cue times ${monotonic ? "in order" : "out of order or invalid"}.`,
    measured,
  };
}

function metadata(c: CreditsInput | null | undefined): Omit<CategoryScore, "id" | "name" | "weight"> {
  const has = (s: unknown) => typeof s === "string" && s.trim() !== "";
  const fields = [["title", c?.title], ["artist", c?.artist], ["writers", c?.writers]] as const;
  const missing = fields.filter(([, v]) => !has(v)).map(([k]) => k);
  const present = fields.length - missing.length;
  return {
    mark: present * T.metadataFieldMarks,
    reason: missing.length ? `${present} of 3 fields present; missing ${missing.join(", ")}.` : "Title, artist and writers all present.",
    measured: [m("Fields present", present, "of 3")],
  };
}

function ending(a: Analysis): Omit<CategoryScore, "id" | "name" | "weight"> {
  const d = a.durationSec;
  let durPart = 0;
  if (fin(d) && d > 0) {
    durPart = d < T.minDurationSec ? 10 * (d / T.minDurationSec) : d > T.maxDurationSec ? 10 * clamp01(1 - (d - T.maxDurationSec) / T.maxDurationSec) : 10;
  }
  const lvl = a.endingLevelDbfs;
  const cut = fin(lvl) && lvl > T.endingCutDbfs;
  const longTail = !fin(a.trailingSilenceSec) || a.trailingSilenceSec > T.endingMaxTrailingSilenceSec;
  const endPart = noSignal(a) || cut || longTail || (!fin(lvl) && lvl !== -Infinity) ? 0 : 10;
  const endWhy = noSignal(a)
    ? "no signal"
    : cut
      ? `cut mid-signal (last 500 ms at ${num(lvl)} dBFS, above ${T.endingCutDbfs})`
      : longTail
        ? `${num(a.trailingSilenceSec)} s of trailing silence (limit ${T.endingMaxTrailingSilenceSec})`
        : "ends clean";
  const durWhy = durPart >= 10 ? "length in range" : `length outside ${T.minDurationSec}-${T.maxDurationSec} s`;
  return {
    mark: durPart + endPart,
    reason: `Duration ${num(d)} s: ${durWhy}; ending ${endWhy}.`,
    measured: [m("Duration", d, "s"), m("Last 500 ms level", lvl, "dBFS"), m("Trailing silence", a.trailingSilenceSec, "s")],
  };
}

export function scoreTrack(
  analysis: Analysis,
  lyricsInput?: LyricsInput | null,
  credits?: CreditsInput | null,
): TrackScore {
  const parts: Record<CategoryId, Omit<CategoryScore, "id" | "name" | "weight">> = {
    loudness: loudness(analysis),
    edges: edges(analysis),
    lyrics: lyrics(analysis, lyricsInput),
    metadata: metadata(credits),
    ending: ending(analysis),
  };
  const categories = CATEGORIES.map((c) => {
    const p = parts[c.id];
    const mark = fin(p.mark) ? Math.min(c.weight, Math.max(0, p.mark)) : 0;
    return { id: c.id, name: c.name, weight: c.weight, ...p, mark };
  });
  const marks = Object.fromEntries(categories.map((c) => [c.id, c.mark])) as Record<CategoryId, number>;
  return { total: composeScore(marks), categories };
}
