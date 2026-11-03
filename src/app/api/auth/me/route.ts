import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const accounts = await db.connectedAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        status: true,
        isDefault: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      user,
      accounts,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 });
  }
}
