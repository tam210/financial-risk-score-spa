import type { Request, Response } from "express";
import { readPrincipal } from "./auth-middleware";
import { generateScore } from "./score";
import { isPlausibleRut, normalizeRut, formatRut } from "./rut";

function canAccessRut(
  principal: { role: "admin" } | { role: "user"; rut: string },
  requestedRut: string,
): boolean {
  if (principal.role === "admin") {
    return true;
  }

  return normalizeRut(principal.rut) === normalizeRut(requestedRut);
}

export function handleGetScore(req: Request, res: Response): void {
  const principal = readPrincipal(res);

  if (!principal) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const requestedRut = req.params.rut;

  if (typeof requestedRut !== "string" || !isPlausibleRut(requestedRut)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  if (!canAccessRut(principal, requestedRut)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const identityRut = normalizeRut(requestedRut);

  res.status(200).json({
    rut: formatRut(identityRut),
    score: generateScore(identityRut),
    fecha: new Date().toISOString(),
  });
}
