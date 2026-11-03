import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Credenciales incompletas" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Correo electrónico o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Correo electrónico o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const userAgent = req.headers.get("user-agent") || undefined;
    const ip = req.headers.get("x-forwarded-for") || undefined;
    const rawToken = await createSession(user.id, userAgent, ip);
    await setSessionCookie(rawToken);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error interno al iniciar sesión" },
      { status: 500 }
    );
  }
}
