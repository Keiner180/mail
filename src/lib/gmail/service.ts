import { google, gmail_v1 } from "googleapis";
import { ConnectedAccount } from "@prisma/client";
import DOMPurify from "isomorphic-dompurify";
import { getAuthenticatedClient } from "./oauth";

export interface EmailHeader {
  name: string;
  value: string;
}

export interface AttachmentInfo {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface EmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  fromEmail: string;
  fromName: string;
  to: string;
  date: string;
  timestamp: number;
  isUnread: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: string[];
}

export interface EmailMessageDetail extends EmailMessageSummary {
  cc?: string;
  bcc?: string;
  bodyHtml?: string;
  bodyText?: string;
  attachments: AttachmentInfo[];
  inReplyTo?: string;
  messageIdHeader?: string;
}

function parseEmailAddress(raw: string): { name: string; email: string } {
  if (!raw) return { name: "", email: "" };
  const match = raw.match(/(.*?)\s*<([^>]+)>/);
  if (match && match[1] !== undefined && match[2] !== undefined) {
    const name = match[1].replace(/^["']|["']$/g, "").trim();
    return { name: name || match[2], email: match[2].trim() };
  }
  return { name: raw.split("@")[0] || raw, email: raw.trim() };
}

function decodeBase64Url(data: string): string {
  if (!data) return "";
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): { html?: string; text?: string; attachments: AttachmentInfo[] } {
  const result: { html?: string; text?: string; attachments: AttachmentInfo[] } = {
    attachments: [],
  };

  if (!payload) return result;

  function traverse(part: gmail_v1.Schema$MessagePart) {
    const mimeType = part.mimeType || "";
    const filename = part.filename;
    const body = part.body;

    // Check for file attachment
    if (filename && filename.length > 0 && body?.attachmentId) {
      result.attachments.push({
        id: body.attachmentId,
        filename,
        mimeType,
        size: body.size || 0,
      });
      return;
    }

    if (mimeType === "text/html" && body?.data && !result.html) {
      result.html = decodeBase64Url(body.data);
    } else if (mimeType === "text/plain" && body?.data && !result.text) {
      result.text = decodeBase64Url(body.data);
    }

    if (part.parts && part.parts.length > 0) {
      for (const subPart of part.parts) {
        traverse(subPart);
      }
    }
  }

  traverse(payload);
  return result;
}

export async function listMessages(
  account: ConnectedAccount,
  options: {
    folder?: string;
    q?: string;
    pageToken?: string;
    maxResults?: number;
  }
): Promise<{ messages: EmailMessageSummary[]; nextPageToken?: string | null; resultSizeEstimate?: number }> {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  const { folder = "INBOX", q = "", pageToken, maxResults = 25 } = options;

  let labelIds: string[] | undefined = undefined;
  const queryParts: string[] = [];

  if (q.trim()) {
    queryParts.push(q.trim());
  }

  const upperFolder = folder.toUpperCase();
  switch (upperFolder) {
    case "INBOX":
      labelIds = ["INBOX"];
      break;
    case "STARRED":
      labelIds = ["STARRED"];
      break;
    case "SENT":
      labelIds = ["SENT"];
      break;
    case "DRAFT":
    case "DRAFTS":
      labelIds = ["DRAFT"];
      break;
    case "SPAM":
      labelIds = ["SPAM"];
      break;
    case "TRASH":
      labelIds = ["TRASH"];
      break;
    case "SNOOZED":
      queryParts.push("label:snoozed");
      break;
    default:
      if (upperFolder !== "ALL") {
        labelIds = [upperFolder];
      }
      break;
  }

  const query = queryParts.join(" ");

  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds,
    q: query || undefined,
    pageToken: pageToken || undefined,
    maxResults,
    includeSpamTrash: upperFolder === "SPAM" || upperFolder === "TRASH",
  });

  const rawMessages = listRes.data.messages || [];
  if (rawMessages.length === 0) {
    return {
      messages: [],
      nextPageToken: listRes.data.nextPageToken || null,
      resultSizeEstimate: listRes.data.resultSizeEstimate || 0,
    };
  }

  // Fetch headers for each message concurrently
  const messagePromises = rawMessages.map(async (msg): Promise<EmailMessageSummary | null> => {
    try {
      if (!msg.id) return null;
      const detailRes = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      });

      const data = detailRes.data;
      const headers = data.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      const rawFrom = getHeader("From");
      const { name: fromName, email: fromEmail } = parseEmailAddress(rawFrom);
      const subject = getHeader("Subject") || "(Sin asunto)";
      const to = getHeader("To");
      const dateStr = getHeader("Date");
      const timestamp = data.internalDate ? parseInt(data.internalDate, 10) : dateStr ? new Date(dateStr).getTime() : Date.now();
      const labels = data.labelIds || [];

      // Check if it has attachments
      let hasAttachments = false;
      if (data.payload?.parts) {
        hasAttachments = data.payload.parts.some((p) => Boolean(p.filename && p.filename.length > 0));
      }

      return {
        id: data.id || msg.id,
        threadId: data.threadId || msg.threadId || "",
        snippet: data.snippet || "",
        subject,
        from: rawFrom,
        fromName,
        fromEmail,
        to,
        date: dateStr,
        timestamp,
        isUnread: labels.includes("UNREAD"),
        isStarred: labels.includes("STARRED"),
        hasAttachments,
        labels,
      };
    } catch (err) {
      console.error(`Error loading message metadata ${msg.id}:`, err);
      return null;
    }
  });

  const resolved = await Promise.all(messagePromises);
  const messages = resolved.filter((m): m is EmailMessageSummary => m !== null);

  return {
    messages,
    nextPageToken: listRes.data.nextPageToken || null,
    resultSizeEstimate: listRes.data.resultSizeEstimate || 0,
  };
}

export async function getMessage(account: ConnectedAccount, messageId: string): Promise<EmailMessageDetail> {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const data = res.data;
  const headers = data.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

  const rawFrom = getHeader("From");
  const { name: fromName, email: fromEmail } = parseEmailAddress(rawFrom);
  const subject = getHeader("Subject") || "(Sin asunto)";
  const to = getHeader("To");
  const cc = getHeader("Cc");
  const bcc = getHeader("Bcc");
  const dateStr = getHeader("Date");
  const messageIdHeader = getHeader("Message-ID");
  const inReplyTo = getHeader("In-Reply-To");
  const timestamp = data.internalDate ? parseInt(data.internalDate, 10) : dateStr ? new Date(dateStr).getTime() : Date.now();
  const labels = data.labelIds || [];

  const bodyData = extractBody(data.payload);

  // Sanitize HTML body for safe rendering
  const sanitizedHtml = bodyData.html
    ? DOMPurify.sanitize(bodyData.html, {
        ADD_ATTR: ["target"],
        FORBID_TAGS: ["script", "iframe", "object", "embed", "applet"],
      })
    : undefined;

  return {
    id: data.id || messageId,
    threadId: data.threadId || "",
    snippet: data.snippet || "",
    subject,
    from: rawFrom,
    fromName,
    fromEmail,
    to,
    cc: cc || undefined,
    bcc: bcc || undefined,
    date: dateStr,
    timestamp,
    isUnread: labels.includes("UNREAD"),
    isStarred: labels.includes("STARRED"),
    hasAttachments: bodyData.attachments.length > 0,
    labels,
    bodyHtml: sanitizedHtml,
    bodyText: bodyData.text,
    attachments: bodyData.attachments,
    inReplyTo: inReplyTo || undefined,
    messageIdHeader: messageIdHeader || undefined,
  };
}

export async function getAttachmentBuffer(
  account: ConnectedAccount,
  messageId: string,
  attachmentId: string
): Promise<{ buffer: Buffer; size: number }> {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });

  const data = res.data.data || "";
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const buffer = Buffer.from(base64, "base64");

  return {
    buffer,
    size: res.data.size || buffer.length,
  };
}

export interface OutgoingEmailPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  attachments?: {
    filename: string;
    mimeType: string;
    contentBase64: string; // standard base64
  }[];
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

function buildMimeMessage(accountEmail: string, payload: OutgoingEmailPayload): string {
  const boundaryMixed = `mixed_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const boundaryAlt = `alt_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  const headers: string[] = [
    `From: <${accountEmail}>`,
    `To: ${payload.to.join(", ")}`,
  ];

  if (payload.cc && payload.cc.length > 0) {
    headers.push(`Cc: ${payload.cc.join(", ")}`);
  }
  if (payload.bcc && payload.bcc.length > 0) {
    headers.push(`Bcc: ${payload.bcc.join(", ")}`);
  }

  // UTF-8 Subject encoding =?UTF-8?B?...?=
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(payload.subject || "(Sin asunto)", "utf-8").toString("base64")}?=`;
  headers.push(`Subject: ${subjectEncoded}`);
  headers.push(`Date: ${new Date().toUTCString()}`);

  if (payload.inReplyTo) {
    headers.push(`In-Reply-To: ${payload.inReplyTo}`);
  }
  if (payload.references) {
    headers.push(`References: ${payload.references}`);
  }

  headers.push("MIME-Version: 1.0");

  const hasAttachments = payload.attachments && payload.attachments.length > 0;

  let body = "";

  if (hasAttachments) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundaryMixed}"`);

    body += `--${boundaryMixed}\r\n`;
    body += `Content-Type: multipart/alternative; boundary="${boundaryAlt}"\r\n\r\n`;

    // Plain text part
    const plainText = payload.bodyText || payload.bodyHtml.replace(/<[^>]+>/g, " ");
    body += `--${boundaryAlt}\r\n`;
    body += `Content-Type: text/plain; charset="UTF-8"\r\n`;
    body += `Content-Transfer-Encoding: base64\r\n\r\n`;
    body += `${Buffer.from(plainText, "utf-8").toString("base64")}\r\n\r\n`;

    // HTML part
    body += `--${boundaryAlt}\r\n`;
    body += `Content-Type: text/html; charset="UTF-8"\r\n`;
    body += `Content-Transfer-Encoding: base64\r\n\r\n`;
    body += `${Buffer.from(payload.bodyHtml, "utf-8").toString("base64")}\r\n\r\n`;

    body += `--${boundaryAlt}--\r\n\r\n`;

    // Attachment parts
    for (const att of payload.attachments!) {
      body += `--${boundaryMixed}\r\n`;
      body += `Content-Type: ${att.mimeType}; name="${att.filename}"\r\n`;
      body += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
      body += `Content-Transfer-Encoding: base64\r\n\r\n`;
      body += `${att.contentBase64}\r\n\r\n`;
    }

    body += `--${boundaryMixed}--\r\n`;
  } else {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundaryAlt}"`);

    const plainText = payload.bodyText || payload.bodyHtml.replace(/<[^>]+>/g, " ");
    body += `--${boundaryAlt}\r\n`;
    body += `Content-Type: text/plain; charset="UTF-8"\r\n`;
    body += `Content-Transfer-Encoding: base64\r\n\r\n`;
    body += `${Buffer.from(plainText, "utf-8").toString("base64")}\r\n\r\n`;

    body += `--${boundaryAlt}\r\n`;
    body += `Content-Type: text/html; charset="UTF-8"\r\n`;
    body += `Content-Transfer-Encoding: base64\r\n\r\n`;
    body += `${Buffer.from(payload.bodyHtml, "utf-8").toString("base64")}\r\n\r\n`;

    body += `--${boundaryAlt}--\r\n`;
  }

  const rawMime = headers.join("\r\n") + "\r\n\r\n" + body;
  // Convert to base64url for Gmail API
  return Buffer.from(rawMime, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendMessage(account: ConnectedAccount, payload: OutgoingEmailPayload) {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  const raw = buildMimeMessage(account.email, payload);

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId: payload.threadId || undefined,
    },
  });

  return res.data;
}

export async function saveDraft(
  account: ConnectedAccount,
  payload: OutgoingEmailPayload & { draftId?: string }
) {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  const raw = buildMimeMessage(account.email, payload);

  if (payload.draftId) {
    const res = await gmail.users.drafts.update({
      userId: "me",
      id: payload.draftId,
      requestBody: {
        message: {
          raw,
          threadId: payload.threadId || undefined,
        },
      },
    });
    return res.data;
  } else {
    const res = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          raw,
          threadId: payload.threadId || undefined,
        },
      },
    });
    return res.data;
  }
}

export async function modifyMessage(
  account: ConnectedAccount,
  messageId: string,
  modifications: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }
) {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds: modifications.addLabelIds || [],
      removeLabelIds: modifications.removeLabelIds || [],
    },
  });

  return res.data;
}

export async function batchModifyMessages(
  account: ConnectedAccount,
  messageIds: string[],
  modifications: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }
) {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  await gmail.users.messages.batchModify({
    userId: "me",
    requestBody: {
      ids: messageIds,
      addLabelIds: modifications.addLabelIds || [],
      removeLabelIds: modifications.removeLabelIds || [],
    },
  });

  return { success: true };
}

export async function trashMessage(account: ConnectedAccount, messageId: string) {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.trash({
    userId: "me",
    id: messageId,
  });

  return res.data;
}

export async function untrashMessage(account: ConnectedAccount, messageId: string) {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.untrash({
    userId: "me",
    id: messageId,
  });

  return res.data;
}

export async function deleteMessage(account: ConnectedAccount, messageId: string) {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  await gmail.users.messages.delete({
    userId: "me",
    id: messageId,
  });

  return { success: true };
}

export async function getAccountProfile(account: ConnectedAccount) {
  const auth = await getAuthenticatedClient(account);
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.getProfile({
    userId: "me",
  });

  return res.data;
}

