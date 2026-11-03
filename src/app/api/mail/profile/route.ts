import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAccountProfile } from "@/lib/gmail/service";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const accountId = req.nextUrl.searchParams.get("accountId");
    let account;
    if (accountId) {
      account = await db.connectedAccount.findFirst({
        where: { id: accountId, userId: user.id },
      });
    } else {
      account = await db.connectedAccount.findFirst({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });
    }

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    const profile = await getAccountProfile(account);

    return NextResponse.json({
      profile,
      account: {
        id: account.id,
        email: account.email,
        name: account.name,
        avatar: account.avatar,
        status: account.status,
      },
    });
  } catch (error: unknown) {
    console.error("Error getting profile:", error);
    const msg = error instanceof Error ? error.message : "Error al obtener perfil de cuenta";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

