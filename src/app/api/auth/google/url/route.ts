import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateAuthUrl } from "@/lib/gmail/oauth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = generateAuthUrl(user.id);
    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error("Error generating OAuth URL:", error);
    const message = error instanceof Error ? error.message : "Error al iniciar autorización con Google";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

