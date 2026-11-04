import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, RateLimitPresets } from "@/lib/security/rate-limiter";

const RegisterSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateLimit = checkRateLimit(`register:${ip}`, RateLimitPresets.AUTH_REGISTER);

    if (!rateLimit.allowed) {
      const waitMinutes = Math.ceil(rateLimit.resetMs / 60000);
      return NextResponse.json(
        {
          error: `Has superado el límite de registros. Por favor espera ${waitMinutes} minutos antes de intentar de nuevo.`,
        },
        { status: 429 }
      );
    }
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const { name, lastName, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario registrado con este correo electrónico" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name: name.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
      },
    });

    // Auto login
    const userAgent = req.headers.get("user-agent") || undefined;
    const rawToken = await createSession(user.id, userAgent, ip);
    await setSessionCookie(rawToken);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al procesar el registro" },
      { status: 500 }
    );
  }
}

