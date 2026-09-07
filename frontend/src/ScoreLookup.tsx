import { useState, type FormEvent } from "react";
import { fetchScore, type ScoreRecord } from "./api";

type ScoreLookupProps = {
  token: string;
  onUnauthorized: () => void;
};

const SCORE_ERRORS = {
  invalid_rut: "Ingresa un RUT válido para realizar la consulta.",
  forbidden: "No tienes permiso para consultar este RUT.",
  unavailable: "No fue posible consultar el score. Inténtalo nuevamente.",
} as const;

function formatConsultationDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function ScoreLookup({ token, onUnauthorized }: ScoreLookupProps) {
  const [rut, setRut] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreRecord | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setResult(null);
    setIsSubmitting(true);

    try {
      const outcome = await fetchScore(token, rut);

      if (outcome.ok) {
        setResult(outcome.data);
        return;
      }

      if (outcome.kind === "unauthorized") {
        onUnauthorized();
        return;
      }

      setError(SCORE_ERRORS[outcome.kind]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="lookup">
      <section className="panel" aria-labelledby="lookup-title">
        <header className="panel-header">
          <h1 id="lookup-title">Consulta de score</h1>
          <p className="subtitle">
            Ingresa un RUT para obtener el score financiero asociado.
          </p>
        </header>
        <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <div className="field">
            <label htmlFor="rut">RUT</label>
            <input
              id="rut"
              name="rut"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="12.345.678-9"
              value={rut}
              onChange={(event) => setRut(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="submit" disabled={isSubmitting}>
            {isSubmitting ? "Consultando..." : "Consultar score"}
          </button>
        </form>
      </section>

      {result ? (
        <section className="panel result" aria-labelledby="result-title">
          <h2 id="result-title">Resultado</h2>
          <p className="score-hero">
            <span className="score-value">{result.score}</span>
            <span className="score-scale">/ 100</span>
          </p>
          <dl className="result-meta">
            <div>
              <dt>RUT</dt>
              <dd>{result.rut}</dd>
            </div>
            <div>
              <dt>Fecha de consulta</dt>
              <dd>
                <time dateTime={result.fecha}>
                  {formatConsultationDate(result.fecha)}
                </time>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
