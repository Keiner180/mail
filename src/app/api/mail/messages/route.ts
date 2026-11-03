import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listMessages } from "@/lib/gmail/service";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const accountId = searchParams.get("accountId");
    const folder = searchParams.get("folder") || "INBOX";
    const q = searchParams.get("q") || "";
    const pageToken = searchParams.get("pageToken") || undefined;
    const maxResults = parseInt(searchParams.get("maxResults") || "25", 10);

    let account;
    if (accountId) {
      account = await db.connectedAccount.findFirst({
        where: { id: accountId, userId: user.id },
      });
    } else {
      // Use default or first account
      account = await db.connectedAccount.findFirst({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });
    }

    if (!account) {
      return NextResponse.json(
        { error: "No hay ninguna cuenta de correo conectada", noAccount: true },
        { status: 404 }
      );
    }

    if (account.status === "revoked") {
      return NextResponse.json(
        {
          error: "El acceso a esta cuenta fue revocado. Por favor, vuelve a vincularla.",
          accountRevoked: true,
          account,
        },
        { status: 403 }
      );
    }

    const result = await listMessages(account, {
      folder,
      q,
      pageToken,
      maxResults,
    });

    return NextResponse.json({
      ...result,
      account: {
        id: account.id,
        email: account.email,
        name: account.name,
        avatar: account.avatar,
      },
    });
  } catch (error: unknown) {
    console.error("Error listing messages:", error);
    const msg = error instanceof Error ? error.message : "Error al obtener mensajes";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
