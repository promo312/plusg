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
- **Credits:** 4.55 / 4000 kiroween26 used (3995.45 remaining). The first pass accounts for 3.68 of the 4.55.
- **Next:** T1 (publish placeholder to Pages), then T2 fixtures.
