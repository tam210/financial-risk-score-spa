import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_ALGORITHM, getJwtSecret } from "./jwt-secret";
import { isPlausibleRut } from "./rut";

export type AccessPrincipal =
  | { role: "admin" }
  | { role: "user"; rut: string };

const jwtSecret = getJwtSecret();

function parsePrincipal(payload: unknown): AccessPrincipal | null {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  if (!("role" in payload) || typeof payload.role !== "string") {
    return null;
  }

  if (payload.role === "admin") {
    if ("rut" in payload) {
      return null;
    }

    return { role: "admin" };
  }

  if (payload.role === "user") {
    if (
      !("rut" in payload) ||
      typeof payload.rut !== "string" ||
      !isPlausibleRut(payload.rut)
    ) {
      return null;
    }

    return { role: "user", rut: payload.rut };
  }

  return null;
}

function unauthorized(res: Response): void {
  res.status(401).json({ error: "Unauthorized" });
}

function readBearerToken(header: string | undefined): string | null {
  if (typeof header !== "string") {
    return null;
  }

  const parts = header.trim().split(/\s+/);

  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;

  if (scheme.toLowerCase() !== "bearer" || token.length === 0) {
    return null;
  }

  return token;
}

function hasNumericExpiration(payload: unknown): boolean {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "exp" in payload &&
    typeof payload.exp === "number" &&
    Number.isFinite(payload.exp)
  );
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = readBearerToken(req.headers.authorization);

  if (!token) {
    unauthorized(res);
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: [JWT_ALGORITHM],
    });

    if (!hasNumericExpiration(payload)) {
      unauthorized(res);
      return;
    }

    const principal = parsePrincipal(payload);

    if (!principal) {
      unauthorized(res);
      return;
    }

    res.locals.principal = principal;
    next();
  } catch {
    unauthorized(res);
  }
}

export function readPrincipal(res: Response): AccessPrincipal | null {
  const principal = res.locals.principal;
  return parsePrincipal(principal);
}
