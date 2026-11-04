import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes email header values to completely prevent CRLF injection attacks
 * that could allow malicious actors to inject extra headers or recipients into outgoing emails.
 */
export function sanitizeEmailHeader(value: string | undefined): string {
  if (!value) return "";
  // Strip carriage returns, newlines, and control characters (ASCII 0-31)
  return value.replace(/[\r\n\x00-\x1F\x7F]+/g, " ").trim();
}

/**
 * Sanitizes an array of email addresses, stripping header injections and invalid characters.
 */
export function sanitizeEmailList(emails: string[] | undefined): string[] {
  if (!emails || !Array.isArray(emails)) return [];
  return emails
    .map((e) => sanitizeEmailHeader(e))
    .filter((e) => e.length > 0 && e.includes("@"));
}

/**
 * Blocked executable and potentially dangerous file extensions for attachments
 */
const FORBIDDEN_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "sh",
  "ps1",
  "vbs",
  "js",
  "msi",
  "scr",
  "pif",
  "reg",
  "dll",
  "com",
  "jar",
]);

const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max Gmail limit

export interface AttachmentValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename: string;
}

/**
 * Validates and sanitizes attachment filenames to prevent path traversal
 * and execution of malicious extensions.
 */
export function validateAndSanitizeAttachment(
  filename: string,
  sizeBytes: number
): AttachmentValidationResult {
  if (!filename || typeof filename !== "string") {
    return { valid: false, error: "Nombre de archivo inválido", sanitizedFilename: "adjunto" };
  }

  // Prevent directory traversal: remove "../", "..\\", and path separators
  let sanitized = filename.replace(/^.*[\\\/]/, "").replace(/\.\./g, "").trim();
  if (!sanitized) sanitized = "adjunto_desconocido";

  // Check file extension
  const parts = sanitized.split(".");
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";

  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Por motivos de seguridad, no se permite adjuntar archivos con extensión .${ext}`,
      sanitizedFilename: sanitized,
    };
  }

  if (sizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: "El archivo adjunto supera el tamaño máximo permitido de 25 MB",
      sanitizedFilename: sanitized,
    };
  }

  return { valid: true, sanitizedFilename: sanitized };
}

/**
 * Advanced HTML email content sanitization for safe rendering.
 * Strips active scripts, iframes, objects, forms, and unsafe schemes (javascript:, vbscript:, data:text/html),
 * while preserving valid styling, layout tables, and typography.
 */
export function sanitizeHtmlEmail(dirtyHtml: string | undefined): string {
  if (!dirtyHtml) return "";

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      "a",
      "abbr",
      "b",
      "bdi",
      "bdo",
      "blockquote",
      "br",
      "cite",
      "code",
      "col",
      "colgroup",
      "dd",
      "del",
      "div",
      "dl",
      "dt",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "i",
      "img",
      "ins",
      "li",
      "ol",
      "p",
      "pre",
      "q",
      "s",
      "small",
      "span",
      "strong",
      "sub",
      "sup",
      "table",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "tr",
      "u",
      "ul",
      "center",
      "font",
    ],
    ALLOWED_ATTR: [
      "align",
      "alt",
      "bgcolor",
      "border",
      "cellpadding",
      "cellspacing",
      "color",
      "colspan",
      "dir",
      "height",
      "href",
      "id",
      "rowspan",
      "size",
      "src",
      "style",
      "title",
      "valign",
      "width",
      "target",
      "rel",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|cid):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ["target", "rel"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "button", "applet"],
    FORBID_ATTR: ["onload", "onerror", "onclick", "onmouseover", "onfocus", "onblur", "formaction"],
    FORCE_BODY: true,
  });
}

