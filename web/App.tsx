import { useRef, useState } from "react";
import { CATEGORIES, LOUDNESS_TARGET_LUFS, THRESHOLDS, TRUE_PEAK_CEILING_DBTP } from "../src/shared/rubric";
import { scoreTrack, type CreditsInput } from "../src/shared/score";
import { formatMeasured, loadErrorMessage } from "../src/shared/load";
import { loadFile, loadSample, type Loaded } from "./loader";

const SAMPLE_CREDITS: CreditsInput = { title: "Paper Boats (sample)", artist: "PlusG demo", writers: "PlusG demo" };

export function App() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [credits, setCredits] = useState<CreditsInput>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function run(label: string, work: () => Promise<Loaded>, nextCredits?: CreditsInput) {
    setBusy(label);
    setError(null);
    try {
      const result = await work();
      setLoaded(result);
      if (nextCredits) setCredits(nextCredits);
    } catch (e) {
      setError(loadErrorMessage(e)); // the previous sheet stays on screen
    } finally {
      setBusy(null);
    }
  }

  const track = loaded ? scoreTrack(loaded.analysis, loaded.lyrics, credits) : null;

  return (
    <main className="sheet">
      <header>
        <h1>PlusG</h1>
        <p className="tagline">Measure. Fix. Release.</p>
      </header>

      <section aria-labelledby="load-h" className="panel">
        <h2 id="load-h">Load a track</h2>
        <div className="actions">
          <button type="button" disabled={busy !== null} onClick={() => run("Measuring the sample", loadSample, SAMPLE_CREDITS)}>
            Try the sample
          </button>
          <label className="file-label">
            <span>Or choose a WAV or MP3 file</span>
            <input
              ref={fileInput}
              type="file"
              accept=".wav,.mp3,audio/wav,audio/mpeg"
              disabled={busy !== null}
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                e.currentTarget.value = "";
                if (f) void run(`Measuring ${f.name}`, () => loadFile(f), {});
              }}
            />
          </label>
        </div>
        <p className="hint">Files stay in your browser. Up to 100 MB and 10 minutes.</p>
        <div role="status" aria-live="polite" className="status">
          {busy ? <span className="busy">{busy}. This can take a few seconds.</span> : null}
        </div>
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
      </section>

      {track && loaded ? (
        <section aria-labelledby="sheet-h" className="panel">
          <h2 id="sheet-h">A&amp;R sheet: {loaded.name}</h2>
          <p className="total" aria-label={`Total score ${track.total} out of 100`}>
            <span className="total-num">{track.total}</span>
            <span className="total-of"> / 100</span>
          </p>

          <ul className="cats">
            {track.categories.map((c) => (
              <li key={c.id}>
                <div className="cat-head">
                  <h3>{c.name}</h3>
                  <span className="mark">
                    {Math.round(c.mark * 10) / 10} / {c.weight}
                  </span>
                </div>
                <p className="reason">{c.reason}</p>
                <dl className="measured">
                  {c.measured.map((m) => (
                    <div key={m.name}>
                      <dt>{m.name}</dt>
                      <dd>{formatMeasured(m.value, m.unit)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>

          <h3>Credits</h3>
          <div className="credits">
            {(["title", "artist", "writers"] as const).map((k) => (
              <label key={k}>
                <span>{k[0]!.toUpperCase() + k.slice(1)}</span>
                <input type="text" value={credits[k] ?? ""} onChange={(e) => setCredits({ ...credits, [k]: e.currentTarget.value })} />
              </label>
            ))}
          </div>
          <p className="hint">Lyrics, fixes and export come next. For now this sheet measures and scores.</p>
        </section>
      ) : null}

      <section aria-labelledby="rubric-h" className="panel">
        <h2 id="rubric-h">How the score works</h2>
        <ul className="rubric">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <span>{c.name}</span>
              <strong>{c.weight}</strong>
            </li>
          ))}
        </ul>
        <p className="hint">
          Targets: {LOUDNESS_TARGET_LUFS} LUFS integrated, true peak at or under {TRUE_PEAK_CEILING_DBTP} dBTP, leading silence up to{" "}
          {THRESHOLDS.leadingSilenceMaxSec} s, trailing silence up to {THRESHOLDS.trailingSilenceMaxSec} s, length {THRESHOLDS.minDurationSec} to{" "}
          {THRESHOLDS.maxDurationSec} s. Full thresholds are in docs/RUBRIC.md.
        </p>
      </section>
    </main>
  );
}
