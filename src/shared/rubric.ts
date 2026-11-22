/** Rubric source of truth. Keep in sync with docs/RUBRIC.md and .kiro/specs/score-rubric. */
export type CategoryId = "loudness" | "edges" | "lyrics" | "metadata" | "ending";

export interface Category {
  id: CategoryId;
  name: string;
  weight: number;
}

export const CATEGORIES: readonly Category[] = [
  { id: "loudness", name: "Loudness and peak", weight: 25 },
  { id: "edges", name: "Clean start and end", weight: 15 },
  { id: "lyrics", name: "Lyric completeness and sync", weight: 25 },
  { id: "metadata", name: "Metadata readiness", weight: 15 },
  { id: "ending", name: "Length and ending", weight: 20 },
] as const;

export const LOUDNESS_TARGET_LUFS = -14;
export const TRUE_PEAK_CEILING_DBTP = -1;

/** Compose a total from category marks. Marks are clamped to [0, weight]; result is an integer 0-100. */
export function composeScore(marks: Record<CategoryId, number>): number {
  let total = 0;
  for (const c of CATEGORIES) {
    const m = marks[c.id];
    total += Number.isFinite(m) ? Math.min(c.weight, Math.max(0, m)) : 0;
  }
  return Math.min(100, Math.max(0, Math.round(total)));
}

/** Thresholds. docs/RUBRIC.md states each of these; keep them in sync. */
export const THRESHOLDS = {
  /** Loudness: full marks within this many LU of the target. */
  loudnessToleranceLu: 1,
  /** Loudness: marks reach 0 this many LU beyond the tolerance. */
  loudnessFalloffLu: 8,
  /** Loudness part of the 25: LUFS 15, true peak 10, clipping penalty 5 (never below 0). */
  loudnessLufsMarks: 15,
  loudnessPeakMarks: 10,
  clippingPenalty: 5,
  /** True peak: marks reach 0 this many dB above the ceiling. */
  peakFalloffDb: 2,
  /** Edges: 7.5 each. Full at or below the limit; 0 at twice the limit. */
  leadingSilenceMaxSec: 1.5,
  trailingSilenceMaxSec: 3,
  /** Lyrics: presence 5, coverage 12, monotonic 8. Full coverage at this share of the duration. */
  lyricsPresenceMarks: 5,
  lyricsCoverageMarks: 12,
  lyricsMonotonicMarks: 8,
  lyricsFullCoverage: 0.6,
  /** Metadata: each field. */
  metadataFieldMarks: 5,
  /** Ending: duration 10, ending 10. */
  minDurationSec: 90,
  maxDurationSec: 360,
  endingCutDbfs: -40,
  endingMaxTrailingSilenceSec: 3,
} as const;
