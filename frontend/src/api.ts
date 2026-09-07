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
