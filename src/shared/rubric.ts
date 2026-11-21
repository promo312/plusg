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
