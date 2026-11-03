import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { exchangeCodeForTokens, fetchGoogleUserProfile } from "@/lib/gmail/oauth";
import { encryptText } from "@/lib/crypto";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    const searchParams = req.nextUrl.searchParams;
    const errorParam = searchParams.get("error");
    if (errorParam) {
      console.error("Google OAuth error parameter:", errorParam);
      return NextResponse.redirect(`${origin}/mail?error=${encodeURIComponent("Permiso de Google denegado o cancelado")}`);
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(`${origin}/mail?error=${encodeURIComponent("Parámetros de autorización inválidos")}`);
    }

    // Decode and validate state
    let stateData: { userId: string; ts: number };
    try {
      const decodedState = Buffer.from(state, "base64url").toString("utf-8");
      stateData = JSON.parse(decodedState);
    } catch {
      return NextResponse.redirect(`${origin}/mail?error=${encodeURIComponent("Estado de autorización inválido")}`);
    }

    const user = await getSessionUser();
    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("Sesión expirada durante la autorización")}`);
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/mail?error=${encodeURIComponent("No se pudo obtener el token de acceso de Google")}`);
    }

    // Fetch user profile from Google to get account email and avatar
    const googleProfile = await fetchGoogleUserProfile(tokens.access_token);
    const googleEmail = googleProfile.email;

    if (!googleEmail) {
      return NextResponse.redirect(`${origin}/mail?error=${encodeURIComponent("No se pudo identificar el correo de la cuenta de Google")}`);
    }

    const accessTokenEnc = encryptText(tokens.access_token);
    const refreshTokenEnc = tokens.refresh_token ? encryptText(tokens.refresh_token) : "";
    const tokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Check if account already exists for this user
    const existing = await db.connectedAccount.findUnique({
      where: {
        userId_email: {
          userId: user.id,
          email: googleEmail,
        },
      },
    });

    const isFirstAccount = (await db.connectedAccount.count({ where: { userId: user.id } })) === 0;

    if (existing) {
      await db.connectedAccount.update({
        where: { id: existing.id },
        data: {
          name: googleProfile.name || existing.name,
          avatar: googleProfile.picture || existing.avatar,
          accessTokenEnc,
          // Preserve existing refresh token if Google didn't return a new one
          refreshTokenEnc: refreshTokenEnc || existing.refreshTokenEnc,
          tokenExpiresAt,
          status: "active",
          lastSyncAt: new Date(),
        },
      });
    } else {
      if (!refreshTokenEnc) {
        console.warn("No refresh token received during initial connection for", googleEmail);
      }

      await db.connectedAccount.create({
        data: {
          userId: user.id,
          email: googleEmail,
          name: googleProfile.name || googleEmail,
          avatar: googleProfile.picture || null,
          accessTokenEnc,
          refreshTokenEnc: refreshTokenEnc || "",
          tokenExpiresAt,
          status: "active",
          isDefault: isFirstAccount,
          lastSyncAt: new Date(),
          scope: tokens.scope || null,
        },
      });
    }

    return NextResponse.redirect(`${origin}/mail?connected=true&email=${encodeURIComponent(googleEmail)}`);
  } catch (error: unknown) {
    console.error("OAuth callback processing error:", error);
    const msg = error instanceof Error ? error.message : "Error al vincular cuenta de Google";
    return NextResponse.redirect(`${origin}/mail?error=${encodeURIComponent(msg)}`);
  }
}
