export function normalizeRut(rut: string): string {
  const compact = rut.trim().toUpperCase().replace(/[.\s]/g, "").replace(/-/g, "");

  if (compact.length < 2) {
    return compact;
  }

  return `${compact.slice(0, -1)}-${compact.slice(-1)}`;
}
