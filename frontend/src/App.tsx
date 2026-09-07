import { useState } from "react";
import { LoginForm } from "./LoginForm";

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  if (accessToken === null) {
    return <LoginForm onAuthenticated={setAccessToken} />;
  }

  return (
    <main className="page">
      <section className="card" aria-labelledby="session-title">
        <header className="card-header">
          <h1 id="session-title">Consulta de Riesgo Financiero</h1>
          <p className="status">Sesión iniciada</p>
          <p className="subtitle">Tu sesión está activa en este dispositivo.</p>
        </header>
      </section>
    </main>
  );
}
