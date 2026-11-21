import { NextRequest, NextResponse } from "next/server";
import { removeSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await removeSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await removeSessionCookie();
  } catch (error) {
    console.error("Logout GET error:", error);
  }
  return NextResponse.redirect(new URL("/auth/login", req.nextUrl.origin));
}

