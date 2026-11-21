---
inclusion: always
---
# Stack conventions
- TypeScript everywhere, strict. One npm package. Node >= 20 for tooling only.
- **No server.** The judged path is static files in the browser: Web Audio decode, JS measurement, canvas drawing, MediaRecorder export. Do not add Express, serverless functions or any backend.
- `src/shared/` pure, framework-free logic (audio math, rubric, score, lyric cues, CD+G encode/decode). Importable by web and tests.
- `web/` Vite + React SPA. No UI framework; plain CSS. Vite `base` stays `./` for Pages.
- Tests: Vitest. Unit in `tests/unit`, property tests (fast-check) in `tests/property`. Every property test names the requirement ID it derives from.
- ffmpeg and ffprobe are development tools only (fixtures, MCP, oracle). Never call them from app code.
- Only free, open tools and libraries. No paid APIs. No network calls on the judged path.
- Work spec-first: change the spec before behavior. Record spikes in `docs/spikes.md`. Record each working session in `docs/kiro-log.md`.
