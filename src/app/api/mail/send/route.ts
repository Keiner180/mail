import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMessage, OutgoingEmailPayload } from "@/lib/gmail/service";
import { sendOutlookMail } from "@/lib/outlook/service";
import { checkRateLimit, RateLimitPresets } from "@/lib/security/rate-limiter";
import {
  sanitizeEmailHeader,
  sanitizeEmailList,
  validateAndSanitizeAttachment,
} from "@/lib/security/sanitizer";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limit per user to prevent automated spamming
    const rateLimit = checkRateLimit(`mail_send:${user.id}`, RateLimitPresets.MAIL_SEND);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Límite de envíos excedido. Espera un momento antes de enviar otro correo." },
        { status: 429 }
      );
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

    // Sanitize recipient lists and headers against CRLF injection
    const sanitizedTo = sanitizeEmailList(Array.isArray(to) ? to : [to]);
    const sanitizedCc = cc ? sanitizeEmailList(Array.isArray(cc) ? cc : [cc]) : undefined;
    const sanitizedBcc = bcc ? sanitizeEmailList(Array.isArray(bcc) ? bcc : [bcc]) : undefined;
    const sanitizedSubject = sanitizeEmailHeader(subject) || "(Sin asunto)";

    if (sanitizedTo.length === 0) {
      return NextResponse.json(
        { error: "Debes especificar al menos un destinatario válido" },
        { status: 400 }
      );
    }

    const account = await db.connectedAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    // Validate and sanitize all attachments
    const sanitizedAttachments: { filename: string; mimeType: string; contentBase64: string }[] = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        const approxSize = Math.round((att.contentBase64.length * 3) / 4);
        const check = validateAndSanitizeAttachment(att.filename, approxSize);
        if (!check.valid) {
          return NextResponse.json({ error: check.error }, { status: 400 });
        }
        sanitizedAttachments.push({
          filename: check.sanitizedFilename,
          mimeType: att.mimeType || "application/octet-stream",
          contentBase64: att.contentBase64,
        });
      }
    }

    const payload: OutgoingEmailPayload = {
      to: sanitizedTo,
      cc: sanitizedCc,
      bcc: sanitizedBcc,
      subject: sanitizedSubject,
      bodyHtml: bodyHtml || "<p></p>",
      bodyText,
      attachments: sanitizedAttachments.length > 0 ? sanitizedAttachments : undefined,
      threadId,
      inReplyTo: inReplyTo ? sanitizeEmailHeader(inReplyTo) : undefined,
      references: references ? sanitizeEmailHeader(references) : undefined,
    };

    const isMicrosoft = account.provider === "microsoft" || account.provider === "outlook";
    let messageId: string | undefined;
    let threadIdRes: string | undefined;

    if (isMicrosoft) {
      const res = await sendOutlookMail(account, {
        to: sanitizedTo,
        cc: sanitizedCc,
        bcc: sanitizedBcc,
        subject: sanitizedSubject,
        bodyHtml: bodyHtml || "<p></p>",
        attachments: sanitizedAttachments.map((a) => ({
          filename: a.filename,
          mimeType: a.mimeType,
          contentBase64: a.contentBase64,
          size: Math.round((a.contentBase64.length * 3) / 4),
        })),
      });
      messageId = res.id;
    } else {
      const res = await sendMessage(account, payload);
      messageId = res.id || undefined;
      threadIdRes = res.threadId || undefined;
    }

    return NextResponse.json({
      success: true,
      messageId,
      threadId: threadIdRes,
    });
  } catch (error: unknown) {
    console.error("Error sending message:", error);
    let msg = error instanceof Error ? error.message : "Error al enviar el correo";
    if (msg.includes("Invalid To header")) {
      msg = "Una o más direcciones de correo de los destinatarios no son válidas o fueron rechazadas por Google.";
    } else if (msg.includes("invalid_grant")) {
      msg = "La autorización de la cuenta expiró. Por favor ve a Ajustes y reconecta tu cuenta.";
    } else if (msg.toLowerCase().includes("quota")) {
      msg = "Has alcanzado el límite de envíos permitido por tu proveedor de correo.";
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

