import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
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

    // Set all accounts of this user to isDefault = false, then set target to true
    await db.$transaction([
      db.connectedAccount.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      }),
      db.connectedAccount.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting default account:", error);
    return NextResponse.json({ error: "Error al actualizar cuenta predeterminada" }, { status: 500 });
  }
}

