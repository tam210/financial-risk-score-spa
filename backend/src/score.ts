import { createHash } from "node:crypto";
import { normalizeRut } from "./rut";

export function generateScore(rut: string): number {
  const digest = createHash("sha256").update(normalizeRut(rut), "utf8").digest();
  return digest.readUInt32BE(0) % 101;
}
