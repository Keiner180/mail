import { ConnectedAccount } from "@prisma/client";
import { getValidMicrosoftAccessToken } from "./oauth";
import { EmailMessageSummary, EmailMessageDetail, AttachmentInfo } from "../gmail/service";
import { sanitizeHtmlEmail } from "../security/sanitizer";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0/me";

function folderToGraphEndpoint(folder: string): string {
  const upper = folder.toUpperCase();
  switch (upper) {
    case "SENT":
      return `${GRAPH_BASE}/mailFolders/sentitems/messages`;
    case "DRAFT":
    case "DRAFTS":
      return `${GRAPH_BASE}/mailFolders/drafts/messages`;
    case "SPAM":
      return `${GRAPH_BASE}/mailFolders/junkemail/messages`;
    case "TRASH":
      return `${GRAPH_BASE}/mailFolders/deleteditems/messages`;
    case "STARRED":
      return `${GRAPH_BASE}/messages?$filter=flag/flagStatus eq 'flagged'`;
    case "INBOX":
    default:
      return `${GRAPH_BASE}/mailFolders/inbox/messages`;
  }
}

export async function listOutlookMessages(
  account: ConnectedAccount,
  options?: {
    folder?: string;
    q?: string;
    pageToken?: string;
    maxResults?: number;
  }
): Promise<{ messages: EmailMessageSummary[]; nextPageToken: string | null }> {
  const accessToken = await getValidMicrosoftAccessToken(account);
  const folder = options?.folder || "INBOX";
  const maxResults = options?.maxResults || 25;

  let url = folderToGraphEndpoint(folder);

  const queryParams: string[] = [
    `$top=${maxResults}`,
    `$select=id,conversationId,subject,bodyPreview,from,toRecipients,receivedDateTime,isRead,flag,hasAttachments`,
    `$orderby=receivedDateTime desc`,
  ];

  if (options?.q && options.q.trim()) {
    queryParams.push(`$search="${encodeURIComponent(options.q.trim())}"`);
  }

  if (options?.pageToken) {
    url = options.pageToken; // Graph API returns full URL for nextLink
  } else {
    url += (url.includes("?") ? "&" : "?") + queryParams.join("&");
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.body-content-type="html"',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Error al consultar mensajes de Outlook");
  }

  const data = await res.json();
  const rawList: any[] = data.value || [];
  const nextPageToken = (data["@odata.nextLink"] as string) || null;

  const messages: EmailMessageSummary[] = rawList.map((m) => {
    const fromEmail = m.from?.emailAddress?.address || "";
    const fromName = m.from?.emailAddress?.name || fromEmail.split("@")[0] || "";
    const dateStr = m.receivedDateTime || "";
    const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();
    const isStarred = m.flag?.flagStatus === "flagged";

    return {
      id: m.id,
      threadId: m.conversationId || m.id,
      snippet: m.bodyPreview || "",
      subject: m.subject || "(Sin asunto)",
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      fromName,
      fromEmail,
      to: (m.toRecipients || []).map((r: any) => r.emailAddress?.address).join(", "),
      date: dateStr,
      timestamp,
      isUnread: !m.isRead,
      isStarred,
      hasAttachments: Boolean(m.hasAttachments),
      labels: [folder.toUpperCase()],
    };
  });

  return {
    messages,
    nextPageToken,
  };
}

export async function getOutlookMessage(
  account: ConnectedAccount,
  messageId: string
): Promise<EmailMessageDetail> {
  const accessToken = await getValidMicrosoftAccessToken(account);

  const res = await fetch(
    `${GRAPH_BASE}/messages/${messageId}?$expand=attachments($select=id,name,contentType,size,isInline)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'outlook.body-content-type="html"',
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Error al obtener mensaje de Outlook");
  }

  const m = await res.json();
  const fromEmail = m.from?.emailAddress?.address || "";
  const fromName = m.from?.emailAddress?.name || fromEmail.split("@")[0] || "";
  const dateStr = m.receivedDateTime || "";
  const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();
  const isStarred = m.flag?.flagStatus === "flagged";

  const rawHtml = m.body?.content || "";
  const bodyHtml = rawHtml ? sanitizeHtmlEmail(rawHtml) : undefined;
  const bodyText = !rawHtml ? m.bodyPreview || "" : undefined;

  const rawAttachments: any[] = m.attachments || [];
  const attachments: AttachmentInfo[] = rawAttachments
    .filter((a) => !a.isInline)
    .map((a) => ({
      id: a.id,
      filename: a.name || "adjunto",
      mimeType: a.contentType || "application/octet-stream",
      size: a.size || 0,
    }));

  return {
    id: m.id,
    threadId: m.conversationId || m.id,
    snippet: m.bodyPreview || "",
    subject: m.subject || "(Sin asunto)",
    from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    fromName,
    fromEmail,
    to: (m.toRecipients || []).map((r: any) => r.emailAddress?.address).join(", "),
    cc: (m.ccRecipients || []).map((r: any) => r.emailAddress?.address).join(", ") || undefined,
    bcc: (m.bccRecipients || []).map((r: any) => r.emailAddress?.address).join(", ") || undefined,
    date: dateStr,
    timestamp,
    isUnread: !m.isRead,
    isStarred,
    hasAttachments: attachments.length > 0,
    labels: [],
    bodyHtml,
    bodyText,
    attachments,
  };
}

export async function sendOutlookMail(
  account: ConnectedAccount,
  input: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml: string;
    attachments?: {
      filename: string;
      mimeType: string;
      contentBase64: string;
      size: number;
    }[];
  }
): Promise<{ id: string }> {
  const accessToken = await getValidMicrosoftAccessToken(account);

  const messagePayload: any = {
    subject: input.subject,
    body: {
      contentType: "HTML",
      content: input.bodyHtml,
    },
    toRecipients: input.to.map((email) => ({
      emailAddress: { address: email.trim() },
    })),
  };

  if (input.cc && input.cc.length > 0) {
    messagePayload.ccRecipients = input.cc.map((email) => ({
      emailAddress: { address: email.trim() },
    }));
  }

  if (input.bcc && input.bcc.length > 0) {
    messagePayload.bccRecipients = input.bcc.map((email) => ({
      emailAddress: { address: email.trim() },
    }));
  }

  if (input.attachments && input.attachments.length > 0) {
    messagePayload.attachments = input.attachments.map((att) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: att.filename,
      contentType: att.mimeType,
      contentBytes: att.contentBase64,
    }));
  }

  const res = await fetch(`${GRAPH_BASE}/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: messagePayload,
      saveToSentItems: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Error al enviar correo vía Outlook");
  }

  return { id: `ms-sent-${Date.now()}` };
}

export async function modifyOutlookMessage(
  account: ConnectedAccount,
  messageId: string,
  updates: {
    isRead?: boolean;
    isStarred?: boolean;
  }
) {
  const accessToken = await getValidMicrosoftAccessToken(account);

  const patchBody: any = {};
  if (typeof updates.isRead === "boolean") {
    patchBody.isRead = updates.isRead;
  }
  if (typeof updates.isStarred === "boolean") {
    patchBody.flag = {
      flagStatus: updates.isStarred ? "flagged" : "notFlagged",
    };
  }

  const res = await fetch(`${GRAPH_BASE}/messages/${messageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patchBody),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Error al actualizar mensaje en Outlook");
  }

  return true;
}

export async function deleteOutlookMessage(
  account: ConnectedAccount,
  messageId: string
) {
  const accessToken = await getValidMicrosoftAccessToken(account);

  const res = await fetch(`${GRAPH_BASE}/messages/${messageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Error al eliminar mensaje en Outlook");
  }

  return true;
}

