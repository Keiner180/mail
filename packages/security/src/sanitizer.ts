import DOMPurify from "isomorphic-dompurify";

const EMAIL_REGEX = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

/**
 * Strips carriage returns and newlines to prevent CRLF Header Injection attacks
 */
export function sanitizeEmailHeader(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/[\r\n\x00-\x1F\x7F]+/g, " ").trim();
}

/**
 * Extracts and strictly validates an email address
 */
export function extractAndValidateEmail(raw: string): { email: string; valid: boolean } {
  if (!raw || typeof raw !== "string") return { email: "", valid: false };
  const sanitized = sanitizeEmailHeader(raw);
  const match = sanitized.match(/<([^>]+)>/);
  const candidate = (match ? match[1] : sanitized)
    .replace(/[<>]/g, "")
    .replace(/[,;]+$/, "")
    .trim();
  const valid = EMAIL_REGEX.test(candidate);
  return { email: candidate, valid };
}

/**
 * Sanitizes an array of email addresses, splitting commas/semicolons and validating TLDs
 */
export function sanitizeEmailList(emails: string[] | undefined): string[] {
  if (!emails || !Array.isArray(emails)) return [];
  const list: string[] = [];
  for (const item of emails) {
    if (!item) continue;
    const tokens = item.split(/[,;\s\n]+/);
    for (const t of tokens) {
      const { email, valid } = extractAndValidateEmail(t);
      if (valid && email && !list.includes(email)) {
        list.push(email);
      }
    }
  }
  return list;
}

/**
 * Strict HTML sanitization for incoming email bodies (XSS prevention)
 */
export function sanitizeHtmlEmail(htmlContent: string): string {
  if (!htmlContent) return "";

  return DOMPurify.sanitize(htmlContent, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel", "style"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "applet", "meta", "base", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
    RETURN_TRUSTED_TYPE: false,
  });
}
