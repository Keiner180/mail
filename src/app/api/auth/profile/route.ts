import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, verifyPassword, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

const ProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const { name, lastName, currentPassword, newPassword } = parsed.data;

    let updateData: { name: string; lastName: string; passwordHash?: string } = {
      name: name.trim(),
      lastName: lastName.trim(),
    };

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Debes ingresar tu contraseña actual para cambiarla" },
          { status: 400 }
        );
      }

      const currentUser = await db.user.findUnique({
        where: { id: user.id },
      });

      if (!currentUser) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }

      const validCurrent = await verifyPassword(currentPassword, currentUser.passwordHash);
      if (!validCurrent) {
        return NextResponse.json(
          { error: "La contraseña actual no es correcta" },
          { status: 400 }
        );
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}

