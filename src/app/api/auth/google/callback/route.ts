import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { exchangeCodeForTokens, fetchGoogleUserProfile } from "@/lib/gmail/oauth";
import { verifySignedOAuthState } from "@/lib/security/csrf";
import { ProvisioningEngine } from "@/lib/provisioning/engine";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3005";

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

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("Sesión expirada durante la autorización")}`);
    }

    // Verify HMAC-signed OAuth state and prevent CSRF
    const stateVerification = verifySignedOAuthState(state, user.id);
    if (!stateVerification.valid) {
      return NextResponse.redirect(
        `${origin}/mail?error=${encodeURIComponent(stateVerification.error || "Estado de autorización inválido")}`
      );
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.access_token) {
      return NextResponse.redirect(`${origin}/mail?error=${encodeURIComponent("No se pudo obtener el token de acceso de Google")}`);
    }

    // Verify user granted Gmail permissions
    const grantedScope = tokens.scope || "";
    const hasGmailScope = grantedScope.includes("gmail") || grantedScope.includes("mail.google.com");
    if (!hasGmailScope) {
      return NextResponse.redirect(
        `${origin}/mail?error=${encodeURIComponent(
          "⚠️ No marcaste la casilla de permisos de Gmail en la pantalla de Google. Por favor vuelve a vincular y asegúrate de MARCAR la casilla 'Ver, editar y redactar correos de Gmail' para poder cargar tu bandeja."
        )}`
      );
    }

    // Fetch user profile from Google to get account email and avatar
    const googleProfile = await fetchGoogleUserProfile(tokens.access_token);
    const googleEmail = googleProfile.email;

    if (!googleEmail) {
      return NextResponse.redirect(`${origin}/mail?error=${encodeURIComponent("No se pudo identificar el correo de la cuenta de Google")}`);
    }

    // Aprovisionamiento atómico e independiente con envelope encryption
    await ProvisioningEngine.bindAccount({
      userId: user.id,
      provider: "google",
      email: googleEmail,
      name: googleProfile.name || googleEmail,
      avatar: googleProfile.picture || null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      scope: tokens.scope || null,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });

    return NextResponse.redirect(`${origin}/mail?connected=true&email=${encodeURIComponent(googleEmail)}`);
  } catch (error: unknown) {
    console.error("OAuth callback processing error:", error);
    const msg = error instanceof Error ? error.message : "Error al vincular cuenta de Google";
    return NextResponse.redirect(`${origin}/mail?error=${encodeURIComponent(msg)}`);
  }
}

