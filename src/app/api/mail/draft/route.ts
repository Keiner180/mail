import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveDraft, OutgoingEmailPayload } from "@/lib/gmail/service";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      accountId,
      draftId,
      to = [],
      cc = [],
      bcc = [],
      subject = "",
      bodyHtml = "",
      bodyText,
      attachments = [],
      threadId,
    } = body;

    const account = await db.connectedAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    const payload: OutgoingEmailPayload & { draftId?: string } = {
      draftId: draftId || undefined,
      to: Array.isArray(to) ? to : to ? [to] : [],
      cc: Array.isArray(cc) ? cc : cc ? [cc] : undefined,
      bcc: Array.isArray(bcc) ? bcc : bcc ? [bcc] : undefined,
      subject: subject || "(Borrador sin asunto)",
      bodyHtml: bodyHtml || "<p></p>",
      bodyText,
      attachments,
      threadId,
    };

    const res = await saveDraft(account, payload);

    return NextResponse.json({
      success: true,
      draftId: res.id,
      messageId: res.message?.id,
    });
  } catch (error: unknown) {
    console.error("Error saving draft:", error);
    const msg = error instanceof Error ? error.message : "Error al guardar el borrador";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
