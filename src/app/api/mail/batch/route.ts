import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { batchModifyMessages } from "@/lib/gmail/service";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { accountId, messageIds, action } = body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: "No se seleccionaron mensajes" }, { status: 400 });
    }

    const account = await db.connectedAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    let addLabelIds: string[] = [];
    let removeLabelIds: string[] = [];

    switch (action) {
      case "markRead":
        removeLabelIds = ["UNREAD"];
        break;
      case "markUnread":
        addLabelIds = ["UNREAD"];
        break;
      case "star":
        addLabelIds = ["STARRED"];
        break;
      case "unstar":
        removeLabelIds = ["STARRED"];
        break;
      case "archive":
        removeLabelIds = ["INBOX"];
        break;
      case "spam":
        addLabelIds = ["SPAM"];
        removeLabelIds = ["INBOX"];
        break;
      case "trash":
        addLabelIds = ["TRASH"];
        removeLabelIds = ["INBOX"];
        break;
      default:
        return NextResponse.json({ error: "Acción por lotes inválida" }, { status: 400 });
    }

    await batchModifyMessages(account, messageIds, { addLabelIds, removeLabelIds });

    return NextResponse.json({ success: true, count: messageIds.length });
  } catch (error: unknown) {
    console.error("Batch modify error:", error);
    const msg = error instanceof Error ? error.message : "Error en operación por lotes";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

