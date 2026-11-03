import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMessage, OutgoingEmailPayload } from "@/lib/gmail/service";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      accountId,
      to,
      cc,
      bcc,
      subject,
      bodyHtml,
      bodyText,
      attachments,
      threadId,
      inReplyTo,
      references,
    } = body;

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return NextResponse.json({ error: "Debes especificar al menos un destinatario" }, { status: 400 });
    }

    const account = await db.connectedAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    const payload: OutgoingEmailPayload = {
      to: Array.isArray(to) ? to : [to],
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      subject: subject || "(Sin asunto)",
      bodyHtml: bodyHtml || "<p></p>",
      bodyText,
      attachments,
      threadId,
      inReplyTo,
      references,
    };

    const res = await sendMessage(account, payload);

    return NextResponse.json({
      success: true,
      messageId: res.id,
      threadId: res.threadId,
    });
  } catch (error: unknown) {
    console.error("Error sending message:", error);
    const msg = error instanceof Error ? error.message : "Error al enviar el correo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

