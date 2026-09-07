import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { ScoreLookup } from "./ScoreLookup";

const SESSION_EXPIRED_NOTICE =
  "Tu sesión expiró o ya no es válida. Inicia sesión nuevamente.";

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  function handleAuthenticated(token: string) {
    setSessionNotice(null);
    setAccessToken(token);
  }

  function handleUnauthorized() {
    setAccessToken(null);
    setSessionNotice(SESSION_EXPIRED_NOTICE);
  }

  function handleSignOut() {
    setAccessToken(null);
    setSessionNotice(null);
  }

  if (accessToken === null) {
    return (
      <LoginForm
        onAuthenticated={handleAuthenticated}
        notice={sessionNotice}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <p className="app-brand">Consulta de Riesgo Financiero</p>
          <button type="button" className="sign-out" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="app-main">
        <ScoreLookup token={accessToken} onUnauthorized={handleUnauthorized} />
      </main>
    </div>
  );
}
