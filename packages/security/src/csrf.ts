import crypto from "crypto";

export interface SignedOAuthState {
  userId: string;
  ts: number;
  nonce: string;
}

function getAppSecret(): string {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error("APP_SECRET no está configurado en las variables de entorno.");
  }
  return secret;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 OAuth State token
 */
export function createSignedOAuthState(userId: string): string {
  const payload: SignedOAuthState = {
    userId,
    ts: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getAppSecret())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a cryptographically signed HMAC-SHA256 OAuth State token
 */
export function verifySignedOAuthState(
  stateString: string,
  maxAgeMs = 15 * 60 * 1000 // 15 min TTL
): { valid: boolean; userId?: string } {
  if (!stateString || !stateString.includes(".")) {
    return { valid: false };
  }

  const [payloadB64, signature] = stateString.split(".");
  if (!payloadB64 || !signature) {
    return { valid: false };
  }

  const expectedSignature = crypto
    .createHmac("sha256", getAppSecret())
    .update(payloadB64)
    .digest("base64url");

  try {
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    if (!isSignatureValid) return { valid: false };

    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload: SignedOAuthState = JSON.parse(payloadJson);

    if (Date.now() - payload.ts > maxAgeMs) {
      return { valid: false };
    }

    return { valid: true, userId: payload.userId };
  } catch {
    return { valid: false };
  }
}
