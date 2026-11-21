import { CATEGORIES } from "../src/shared/rubric";

// Scaffold shell. The Measure / Fix / Release flow is implemented per tasks.md (T5+).
export function App() {
  return (
    <main className="sheet">
      <header>
        <h1>PlusG</h1>
        <p>Measure. Fix. Release.</p>
      </header>
      <section aria-label="Rubric">
        <h2>A&amp;R rubric</h2>
        <ul>
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              {c.name} <strong>{c.weight}</strong>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
