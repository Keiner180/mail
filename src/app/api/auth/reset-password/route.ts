import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/crypto";
import { hashPassword } from "@/lib/auth";

const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token de recuperación inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);

    const resetRecord = await db.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "El enlace de recuperación es inválido o ya ha sido utilizado" },
        { status: 400 }
      );
    }

    if (resetRecord.usedAt || new Date() > resetRecord.expiresAt) {
      return NextResponse.json(
        { error: "El enlace de recuperación ha expirado o ya fue utilizado" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Update user password and mark token as used in a transaction
    await db.$transaction([
      db.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all active sessions for security
      db.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Error al restablecer la contraseña" },
      { status: 500 }
    );
  }
}

