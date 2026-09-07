const MIN_JWT_SECRET_BYTES = 32;

export const JWT_ALGORITHM = "HS256" as const;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < MIN_JWT_SECRET_BYTES) {
    throw new Error(
      `JWT_SECRET is required and must be at least ${MIN_JWT_SECRET_BYTES} UTF-8 bytes`,
    );
  }

  return secret;
}
