import { ConnectedAccount } from "@prisma/client";
import { db } from "../db";
import { encryptText, decryptText } from "../crypto";
import { createSignedOAuthState } from "../security/csrf";

const MS_AUTH_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MS_TOKEN_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MS_GRAPH_ME = "https://graph.microsoft.com/v1.0/me";

const MS_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "Mail.ReadWrite",
  "Mail.Send",
  "User.Read",
];

export function getMicrosoftCredentials() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI || "http://localhost:3005/api/auth/microsoft/callback";

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

export function generateMicrosoftAuthUrl(userId: string): { url: string; state: string } {
  const { clientId, redirectUri, isConfigured } = getMicrosoftCredentials();

  if (!isConfigured || !clientId) {
    throw new Error(
      "Credenciales de Microsoft OAuth 2.0 (MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET) no configuradas en .env."
    );
  }

  const state = createSignedOAuthState(userId);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: MS_SCOPES.join(" "),
    state,
    prompt: "consent",
  });

  return {
    url: `${MS_AUTH_ENDPOINT}?${params.toString()}`,
    state,
  };
}

export async function exchangeMicrosoftCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getMicrosoftCredentials();

  if (!clientId || !clientSecret) {
    throw new Error("Credenciales de Microsoft OAuth no configuradas.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(MS_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Error al obtener tokens de Microsoft");
  }

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresIn: data.expires_in as number,
    scope: data.scope as string,
  };
}

export async function refreshMicrosoftToken(account: ConnectedAccount): Promise<string> {
  const { clientId, clientSecret, redirectUri } = getMicrosoftCredentials();
  if (!clientId || !clientSecret) {
    throw new Error("Credenciales de Microsoft OAuth no configuradas.");
  }

  const refreshToken = decryptText(account.refreshTokenEnc);

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
    grant_type: "refresh_token",
  });

  const res = await fetch(MS_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    if (data.error === "invalid_grant") {
      await db.connectedAccount.update({
        where: { id: account.id },
        data: { status: "revoked" },
      });
      throw new Error("El acceso a la cuenta de Microsoft fue revocado.");
    }
    throw new Error(data.error_description || "Error al renovar token de Microsoft");
  }

  const newAccessToken = data.access_token as string;
  const newRefreshToken = (data.refresh_token as string) || refreshToken;
  const expiresIn = data.expires_in as number;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await db.connectedAccount.update({
    where: { id: account.id },
    data: {
      accessTokenEnc: encryptText(newAccessToken),
      refreshTokenEnc: encryptText(newRefreshToken),
      tokenExpiresAt: expiresAt,
      status: "active",
      updatedAt: new Date(),
    },
  });

  return newAccessToken;
}

export async function getValidMicrosoftAccessToken(account: ConnectedAccount): Promise<string> {
  const isExpired =
    !account.tokenExpiresAt || new Date(account.tokenExpiresAt).getTime() - Date.now() < 300000;

  if (isExpired) {
    return refreshMicrosoftToken(account);
  }

  return decryptText(account.accessTokenEnc);
}

export async function fetchMicrosoftUserProfile(accessToken: string) {
  const res = await fetch(MS_GRAPH_ME, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Error al consultar el perfil de Microsoft Graph");
  }

  const data = await res.json();
  const email = data.mail || data.userPrincipalName || "";
  const name = data.displayName || email.split("@")[0] || "Usuario Outlook";

  return {
    email,
    name,
    id: data.id,
  };
}

