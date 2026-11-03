import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const account = await db.connectedAccount.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    await db.connectedAccount.delete({
      where: { id },
    });

    // If deleted account was default, set another active account as default if exists
    if (account.isDefault) {
      const nextAccount = await db.connectedAccount.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });

      if (nextAccount) {
        await db.connectedAccount.update({
          where: { id: nextAccount.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Cuenta desvinculada exitosamente" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Error al desvincular cuenta" }, { status: 500 });
  }
}

