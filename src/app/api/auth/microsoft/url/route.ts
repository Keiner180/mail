import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateMicrosoftAuthUrl, getMicrosoftCredentials } from "@/lib/outlook/oauth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { isConfigured } = getMicrosoftCredentials();

    if (!isConfigured) {
      return NextResponse.json({
        configured: false,
        error:
          "Microsoft OAuth 2.0 no está configurado en las variables de entorno (MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET).",
      });
    }

    const { url } = generateMicrosoftAuthUrl(user.id);
    return NextResponse.json({ configured: true, url });
  } catch (error: any) {
    console.error("Microsoft auth URL error:", error);
    return NextResponse.json(
      { error: error.message || "Error al iniciar conexión con Microsoft" },
      { status: 500 }
    );
  }
}

