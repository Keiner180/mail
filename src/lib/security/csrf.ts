import crypto from "crypto";

const STATE_SECRET = process.env.APP_SECRET || "jabvox-default-state-secret-must-override";
const STATE_TTL_MS = 15 * 60 * 1000; // 15 minutes validity

export interface OAuthStatePayload {
  userId: string;
  ts: number;
  nonce: string;
}

/**
 * Creates a cryptographically signed state token with HMAC-SHA256 and expiration
 */
export function createSignedOAuthState(userId: string): string {
  const payload: OAuthStatePayload = {
    userId,
    ts: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", STATE_SECRET)
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
}

/**
 * Verifies the signed OAuth state token, validating signature, expiration, and user ID
 */
export function verifySignedOAuthState(
  stateToken: string,
  expectedUserId: string
): { valid: boolean; error?: string } {
  if (!stateToken || typeof stateToken !== "string") {
    return { valid: false, error: "Token de estado no proporcionado" };
  }

  const parts = stateToken.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Formato de token de estado inválido" };
  }

  const [data, signature] = parts;
  if (!data || !signature) {
    return { valid: false, error: "Componentes del token incompletos" };
  }

  // Verify HMAC signature
  const expectedSig = crypto
    .createHmac("sha256", STATE_SECRET)
    .update(data)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: "Firma criptográfica de estado inválida" };
  }

  try {
    const json = Buffer.from(data, "base64url").toString("utf-8");
    const payload: OAuthStatePayload = JSON.parse(json);

    // Validate expiration
    if (Date.now() - payload.ts > STATE_TTL_MS) {
      return { valid: false, error: "La solicitud de autorización ha expirado. Por favor intenta de nuevo." };
    }

    // Validate user match
    if (payload.userId !== expectedUserId) {
      return { valid: false, error: "El usuario autorizado no coincide con la sesión actual" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Error al deserializar estado de autorización" };
  }
}

