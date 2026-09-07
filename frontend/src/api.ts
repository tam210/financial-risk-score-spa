export type LoginFailure = "invalid_credentials" | "unavailable";

export type LoginResult =
  | { ok: true; token: string }
  | { ok: false; kind: LoginFailure };

function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;

  if (!url) {
    throw new Error("VITE_API_URL is required");
  }

  return url.replace(/\/$/, "");
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResult> {
  let response: Response;

  try {
    response = await fetch(`${getApiUrl()}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return { ok: false, kind: "unavailable" };
  }

  if (response.status === 401) {
    return { ok: false, kind: "invalid_credentials" };
  }

  if (!response.ok) {
    return { ok: false, kind: "unavailable" };
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    return { ok: false, kind: "unavailable" };
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("token" in data) ||
    typeof data.token !== "string" ||
    data.token.length === 0
  ) {
    return { ok: false, kind: "unavailable" };
  }

  return { ok: true, token: data.token };
}

export type ScoreRecord = {
  rut: string;
  score: number;
  fecha: string;
};

export type ScoreFailure =
  | "invalid_rut"
  | "unauthorized"
  | "forbidden"
  | "unavailable";

export type ScoreResult =
  | { ok: true; data: ScoreRecord }
  | { ok: false; kind: ScoreFailure };

function isScoreRecord(data: unknown): data is ScoreRecord {
  return (
    typeof data === "object" &&
    data !== null &&
    "rut" in data &&
    typeof data.rut === "string" &&
    data.rut.length > 0 &&
    "score" in data &&
    typeof data.score === "number" &&
    Number.isInteger(data.score) &&
    data.score >= 0 &&
    data.score <= 100 &&
    "fecha" in data &&
    typeof data.fecha === "string" &&
    data.fecha.length > 0 &&
    !Number.isNaN(Date.parse(data.fecha))
  );
}

export async function fetchScore(
  token: string,
  rut: string,
): Promise<ScoreResult> {
  const trimmedRut = rut.trim();

  if (trimmedRut.length === 0) {
    return { ok: false, kind: "invalid_rut" };
  }

  let response: Response;

  try {
    response = await fetch(
      `${getApiUrl()}/score/${encodeURIComponent(trimmedRut)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  } catch {
    return { ok: false, kind: "unavailable" };
  }

  if (response.status === 400) {
    return { ok: false, kind: "invalid_rut" };
  }

  if (response.status === 401) {
    return { ok: false, kind: "unauthorized" };
  }

  if (response.status === 403) {
    return { ok: false, kind: "forbidden" };
  }

  if (!response.ok) {
    return { ok: false, kind: "unavailable" };
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    return { ok: false, kind: "unavailable" };
  }

  if (!isScoreRecord(data)) {
    return { ok: false, kind: "unavailable" };
  }

  return { ok: true, data };
}
