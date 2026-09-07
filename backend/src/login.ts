import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_ALGORITHM, getJwtSecret } from "./jwt-secret";
import { authenticate, type AuthenticatedAccount } from "./mock-users";

const JWT_EXPIRES_IN_SECONDS = 900;

type AccessTokenPayload =
  | { role: "admin" }
  | { role: "user"; rut: string };

const jwtSecret = getJwtSecret();

function buildAccessTokenPayload(
  account: AuthenticatedAccount,
): AccessTokenPayload {
  if (account.role === "admin") {
    return { role: "admin" };
  }

  return { role: "user", rut: account.rut };
}

function readLoginCredentials(
  body: unknown,
): { username: string; password: string } | null {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  if (!("username" in body) || !("password" in body)) {
    return null;
  }

  const { username, password } = body;

  if (typeof username !== "string" || username.trim().length === 0) {
    return null;
  }

  if (typeof password !== "string" || password.length === 0) {
    return null;
  }

  return { username: username.trim(), password };
}

export function handleLogin(req: Request, res: Response): void {
  const credentials = readLoginCredentials(req.body as unknown);

  if (!credentials) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const account = authenticate(credentials.username, credentials.password);

  if (!account) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const payload = buildAccessTokenPayload(account);

  try {
    const token = jwt.sign(payload, jwtSecret, {
      algorithm: JWT_ALGORITHM,
      expiresIn: JWT_EXPIRES_IN_SECONDS,
    });

    res.status(200).json({ token });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}
