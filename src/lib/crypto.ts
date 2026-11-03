import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY environment variable is not configured");
  }
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) {
    // If not 32 bytes hex, derive 32 bytes via sha256
    return crypto.createHash("sha256").update(keyHex).digest();
  }
  return key;
}

/**
 * Encrypts a string using AES-256-GCM
 */
export function encryptText(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Format: iv:authTag:ciphertext
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a ciphertext encrypted with AES-256-GCM
 */
export function decryptText(encryptedValue: string): string {
  if (!encryptedValue) return "";
  const parts = encryptedValue.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format");
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  if (!ivHex || !authTagHex || !cipherHex) {
    throw new Error("Invalid encrypted components");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Creates a secure random token hex string
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Hashes a token using SHA-256 for fast indexed lookups
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
