# Kiro log

One entry per working session: date, Kiro surface, what was asked, what the spec, a hook or a property test caught, and the credit balance.

## 2026-11-21 (Saturday)

- **Kiro surface:** CLI
- **Asked:**
  1. First brief (the plan's section 8 brief, no amendments): steering, root spec, README, `.gitignore` that keeps `.kiro`, scaffold, test runner, placeholder deploy. No feature work.
  2. Amendment run: browser-only, static hosting, JS loudness meter checked against ffmpeg `ebur128` within 0.1 LU, tap-along lyrics, a real CD+G packet stream behind the retro preview, "Length and ending" replaces "Length and structure", loudness gain capped by true-peak headroom with re-measure, no Compact Disc logo. Remove all server code. GitHub Pages workflow. This log.
- **What happened:**
  - The first pass built a server-based scaffold (Express app, Dockerfile, Render config, ffmpeg analysis endpoint plan). It cost 3.68 credits and was thrown away. The GM's handoff calls for a static, browser-only site, and the 4,000 credits have no refill.
  - The amendment run was interrupted once and restarted. The restart picked up from the files already on disk and finished the rewrite.
  - Rewritten to match the amendments: requirements, design, tasks, the three focused specs, all steering files, two hooks, three agents, `docs/RUBRIC.md`, README, `package.json`, Vite config. Removed: `server/`, `Dockerfile`, `.dockerignore`, `render.yaml`, `.env.example`, the health test, Express, multer, supertest and related deps.
- **What the spec, a hook or a property test caught:**
  - Spec: writing the design in EARS form exposed that "silence trim", "loudness fix" and "score" were not tied together. R2.5 now requires re-measuring fixed audio and scoring from that measurement, and P6 (true peak at or under the ceiling after any fix) was added.
  - Spec: the original "Length and structure" category could not show a measured number without section detection. The deviation and its reason are written in `score-rubric/requirements.md`.
  - Spec: the pre-amendment hook pattern still matched `server/**`. It is now `src/shared/**` and `tests/**`.
  - Property tests: P1 and P2 (score is an integer 0-100; a category cannot exceed its weight) exist and pass on the scaffold. They did not catch a defect yet.
  - Hooks: none fired in this session; they are defined but untested in the IDE.
- **Credits:** 8.41 / 4000 kiroween26 used (3991.59 remaining), from the CLI usage summaries: first pass 3.67, aborted amendment run 0.87, restarted amendment run 3.86. An earlier figure of 4.55 (3995.45 remaining) was recorded mid-session, before the restarted run finished.
- **Next:** T1 (publish placeholder to Pages), then T2 fixtures.

## 2026-11-21 (Saturday evening), session 2

- **Kiro surface:** CLI (kiro-cli 3.5, `chat --no-interactive`, v3 engine, one new chat per turn). An earlier label said IDE: the session self-reports as IDE, but it was driven from the CLI.
- **Turn 1:** marked T1 done (Pages is live at https://promo312.github.io/plusg/), added the live link to the README, removed three tracked agent `.bak` files, and upgraded vitest from 3 to 4, which cleared 2 critical and 1 moderate `npm audit` advisories (tinypool). Built T2: nine ffmpeg-generated fixtures with ebur128 oracle JSON. The CLI's agent-config upgrade at launch rewrote the three `.kiro/agents` JSONs (added `permissions` and `kiroUpgrade`) and left `.bak.1` backups. I kept the upgraded JSONs and deleted the backups.
- **Turn 2:** T3 meter (K-weighting, gated loudness, loudness range, 4x true peak, clipping, silence, ending level). The oracle test passes within 0.1 LU and 0.3 dB on all nine fixtures; the worst gaps are 0.006 LU and 0.046 dB (mono). The oracle JSON now has precise keys because ffmpeg's summary rounds to 0.1. The clipped threshold is 32767/32768.
- **Turn 3:** T4 `scoreTrack`, `RUBRIC` thresholds, P1 and P2 run over `scoreTrack`, and fixture score tests. The cut threshold moved from -30 to -40 dBFS because the cut fixture ends at -31.6 dBFS.
- **Turn 4:** T5 load and sheet UI with a Web Worker, sample assets, and limits (100 MB, 10 minutes, empty audio). Headless check at 390 px: 87/100, no horizontal scroll, no console errors, same-origin requests only.
- **Turn 5:** this log update.
- **What the spec, a hook or a property test caught:**
  - Spec: it said clipped means |x| >= 1.0, which a 16-bit decode never reaches on the positive side. The threshold is now 32767/32768.
  - Oracle: the rounded ffmpeg summary (0.1) could not support a 0.1 LU check, hence the precise keys.
  - Unit test: my expectation was wrong (a dual-mono sine is 3 dB louder than mono). The test caught it.
  - Fixture score test: it showed the cut fixture ends at -31.6 dBFS, so the -30 dBFS cut threshold could not work. It is now -40.
  - Hooks: none fired. Hooks only run in the IDE.
  - Property tests: they have not caught a defect in product code yet.
- **Credits:** turns 1 to 4 used 13.67 (3.43, 3.57, 3.01, 3.67). Running total 22.08 / 4000 used, 3977.92 remaining before this logging turn. Its small cost is counted in the next entry.
- **Next:** T6 lyrics and tap-along (needs Ninja's demo song by Tue Nov 24), then T7 fixes.
