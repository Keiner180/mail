import { google } from "googleapis";
import { ConnectedAccount } from "@prisma/client";
import { db } from "../db";
import { encryptText, decryptText } from "../crypto";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.modify",
];

export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3005/api/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Credenciales de Google OAuth no configuradas en variables de entorno.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function generateAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();

  // State encodes userId and a timestamp to prevent CSRF
  const statePayload = JSON.stringify({
    userId,
    ts: Date.now(),
  });
  const state = Buffer.from(statePayload).toString("base64url");

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // Ensures we always get a refresh token
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function fetchGoogleUserProfile(accessToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data;
}

/**
 * Returns an authenticated OAuth2Client, automatically refreshing the access token if needed.
 */
export async function getAuthenticatedClient(account: ConnectedAccount) {
  const oauth2Client = getOAuth2Client();

  const accessToken = decryptText(account.accessTokenEnc);
  const refreshToken = decryptText(account.refreshTokenEnc);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: account.tokenExpiresAt ? account.tokenExpiresAt.getTime() : undefined,
  });

  // Check if token is expired or will expire in less than 5 minutes
  const now = Date.now();
  const expiresAt = account.tokenExpiresAt ? account.tokenExpiresAt.getTime() : 0;
  const isExpiringSoon = !expiresAt || expiresAt - now < 5 * 60 * 1000;

  if (isExpiringSoon && refreshToken) {
    try {
      const refreshed = await oauth2Client.refreshAccessToken();
      const newTokens = refreshed.credentials;

      const newAccessTokenEnc = encryptText(newTokens.access_token || accessToken);
      const newRefreshTokenEnc = newTokens.refresh_token
        ? encryptText(newTokens.refresh_token)
        : account.refreshTokenEnc;

      const newExpiry = newTokens.expiry_date ? new Date(newTokens.expiry_date) : null;

      await db.connectedAccount.update({
        where: { id: account.id },
        data: {
          accessTokenEnc: newAccessTokenEnc,
          refreshTokenEnc: newRefreshTokenEnc,
          tokenExpiresAt: newExpiry,
          status: "active",
          lastSyncAt: new Date(),
        },
      });

      oauth2Client.setCredentials(newTokens);
    } catch (err: unknown) {
      console.error(`Error renovando token para cuenta ${account.email}:`, err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("invalid_grant")) {
        await db.connectedAccount.update({
          where: { id: account.id },
          data: { status: "revoked" },
        });
        throw new Error("El acceso a Gmail fue revocado o expiró. Por favor, vuelve a vincular tu cuenta.");
      }
      throw err;
    }
  }

  return oauth2Client;
}

