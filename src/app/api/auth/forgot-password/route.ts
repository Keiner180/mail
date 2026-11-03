import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateRandomToken, hashToken } from "@/lib/crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Correo inválido" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await db.user.findUnique({
      where: { email },
    });

    // Don't disclose if user exists for security reasons, but process if exists
    if (user) {
      // Invalidate previous tokens
      await db.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const rawToken = generateRandomToken(32);
      const tokenHash = hashToken(rawToken);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour validity

      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token: tokenHash,
          expiresAt,
        },
      });

      const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3005";
      const resetUrl = `${origin}/auth/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    }

    return NextResponse.json({
      success: true,
      message: "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud de recuperación" },
      { status: 500 }
    );
  }
}

