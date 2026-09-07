import { useState, type FormEvent } from "react";
import { login } from "./api";

type LoginFormProps = {
  onAuthenticated: (token: string) => void;
  notice?: string | null;
};

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
      />
      <circle
        cx="12"
        cy="12"
        r="2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3.5 21 20.5M9.2 9.4A3 3 0 0 0 12 15.2a3 3 0 0 0 2.7-1.6M6.3 6.7C4.3 8.1 2.8 10.2 2.2 12c.8 2.3 4.2 6.5 9.8 6.5 2.1 0 3.9-.6 5.4-1.5M10.4 5.7C10.9 5.6 11.5 5.5 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.2 2.7"
      />
    </svg>
  );
}

export function LoginForm({
  onAuthenticated,
  notice = null,
}: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(notice);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(username, password);

      if (result.ok) {
        onAuthenticated(result.token);
        return;
      }

      setError(
        result.kind === "invalid_credentials"
          ? "Credenciales incorrectas."
          : "No fue posible iniciar sesión. Inténtalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="card" aria-labelledby="login-title">
        <header className="card-header">
          <h1 id="login-title">Consulta de Riesgo Financiero</h1>
          <p className="subtitle">
            Inicia sesión para consultar el score financiero según RUT.
          </p>
        </header>
        <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <div className="field">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={
                  isPasswordVisible ? "Ocultar contraseña" : "Ver contraseña"
                }
                aria-pressed={isPasswordVisible}
                aria-controls="password"
                disabled={isSubmitting}
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}
