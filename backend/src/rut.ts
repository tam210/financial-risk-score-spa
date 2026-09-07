export function normalizeRut(rut: string): string {
  const compact = rut.trim().toUpperCase().replace(/[.\s]/g, "").replace(/-/g, "");

  if (compact.length < 2) {
    return compact;
  }

  return `${compact.slice(0, -1)}-${compact.slice(-1)}`;
}

export function formatRut(rut: string): string {
  const normalized = normalizeRut(rut);

  if (normalized.length < 2 || !normalized.includes("-")) {
    return normalized;
  }

  const [body, verifier] = normalized.split("-");
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${withDots}-${verifier}`;
}

function hasChileanThousandGrouping(body: string): boolean {
  if (!body.includes(".")) {
    return false;
  }

  const groups = body.split(".");

  if (groups.some((group) => group.length === 0 || !/^\d+$/.test(group))) {
    return false;
  }

  const digits = groups.join("");

  if (digits.length < 1 || digits.length > 8) {
    return false;
  }

  if (groups[0].length < 1 || groups[0].length > 3) {
    return false;
  }

  for (let index = 1; index < groups.length; index += 1) {
    if (groups[index].length !== 3) {
      return false;
    }
  }

  return true;
}

export function isPlausibleRut(rut: string): boolean {
  const value = rut.trim().toUpperCase();

  if (value.length === 0 || /\s/.test(value)) {
    return false;
  }

  if (/^\d{1,8}[\dK]$/.test(value)) {
    return true;
  }

  if (/^\d{1,8}-[\dK]$/.test(value)) {
    return true;
  }

  const dotted = /^([\d.]+)-([\dK])$/.exec(value);

  if (!dotted) {
    return false;
  }

  return hasChileanThousandGrouping(dotted[1]);
}
