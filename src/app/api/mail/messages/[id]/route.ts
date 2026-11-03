import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getMessage,
  modifyMessage,
  trashMessage,
  untrashMessage,
  deleteMessage,
} from "@/lib/gmail/service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: messageId } = await params;
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

    const message = await getMessage(account, messageId);

    // Auto mark as read if it was unread
    if (message.isUnread) {
      modifyMessage(account, messageId, { removeLabelIds: ["UNREAD"] }).catch((err) =>
        console.error("Failed to auto-mark as read:", err)
      );
      message.isUnread = false;
      message.labels = message.labels.filter((l) => l !== "UNREAD");
    }

    return NextResponse.json({ message });
  } catch (error: unknown) {
    console.error("Error retrieving message:", error);
    const msg = error instanceof Error ? error.message : "Error al obtener el correo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: messageId } = await params;
    const body = await req.json();
    const { accountId, action } = body;

    const account = await db.connectedAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    switch (action) {
      case "markRead":
        await modifyMessage(account, messageId, { removeLabelIds: ["UNREAD"] });
        break;
      case "markUnread":
        await modifyMessage(account, messageId, { addLabelIds: ["UNREAD"] });
        break;
      case "star":
        await modifyMessage(account, messageId, { addLabelIds: ["STARRED"] });
        break;
      case "unstar":
        await modifyMessage(account, messageId, { removeLabelIds: ["STARRED"] });
        break;
      case "archive":
        await modifyMessage(account, messageId, { removeLabelIds: ["INBOX"] });
        break;
      case "spam":
        await modifyMessage(account, messageId, {
          addLabelIds: ["SPAM"],
          removeLabelIds: ["INBOX"],
        });
        break;
      case "trash":
        await trashMessage(account, messageId);
        break;
      case "untrash":
        await untrashMessage(account, messageId);
        break;
      default:
        return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error updating message labels:", error);
    const msg = error instanceof Error ? error.message : "Error al actualizar mensaje";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: messageId } = await params;
    const accountId = req.nextUrl.searchParams.get("accountId");
    const permanent = req.nextUrl.searchParams.get("permanent") === "true";

    const account = await db.connectedAccount.findFirst({
      where: { id: accountId || undefined, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    if (permanent) {
      await deleteMessage(account, messageId);
    } else {
      await trashMessage(account, messageId);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting message:", error);
    const msg = error instanceof Error ? error.message : "Error al eliminar mensaje";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

