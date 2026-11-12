import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { exchangeMicrosoftCode, fetchMicrosoftUserProfile } from "@/lib/outlook/oauth";
import { verifySignedOAuthState } from "@/lib/security/csrf";
import { ProvisioningEngine } from "@/lib/provisioning/engine";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = req.nextUrl.origin;

  if (error || !code) {
    const errorMsg = errorDescription || error || "Autorización cancelada o denegada por Microsoft";
    return NextResponse.redirect(
      new URL(`/mail?error=${encodeURIComponent(errorMsg)}`, baseUrl)
    );
  }

  if (!state) {
    return NextResponse.redirect(
      new URL("/mail?error=Solicitud+inválida+sin+parámetro+state", baseUrl)
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/login?error=Sesión+expirada+durante+la+autorización", baseUrl)
    );
  }

  const stateVerification = verifySignedOAuthState(state, user.id);
  if (!stateVerification.valid) {
    return NextResponse.redirect(
      new URL(`/mail?error=${encodeURIComponent(stateVerification.error || "Estado inválido")}`, baseUrl)
    );
  }

  try {
    // Exchange code for Microsoft tokens
    const tokens = await exchangeMicrosoftCode(code);
    const profile = await fetchMicrosoftUserProfile(tokens.accessToken);

    if (!profile.email) {
      return NextResponse.redirect(
        new URL("/mail?error=No+se+pudo+obtener+el+correo+de+la+cuenta+Microsoft", baseUrl)
      );
    }

    const email = profile.email.toLowerCase();
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    // Aprovisionamiento atómico e independiente con envelope encryption
    await ProvisioningEngine.bindAccount({
      userId: user.id,
      provider: "microsoft",
      email,
      name: profile.name || email,
      avatar: null,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      scope: tokens.scope || null,
      tokenExpiresAt: expiresAt,
    });

    return NextResponse.redirect(
      new URL(`/mail?connected=true&email=${encodeURIComponent(email)}&provider=outlook`, baseUrl)
    );
  } catch (err: any) {
    console.error("Microsoft OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(
        `/mail?error=${encodeURIComponent(err.message || "Error al vincular cuenta de Microsoft")}`,
        baseUrl
      )
    );
  }
}
