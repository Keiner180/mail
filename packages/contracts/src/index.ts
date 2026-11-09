import { z } from "zod";

// ==========================================
// User & Auth Contracts
// ==========================================
export const UserRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const RegisterUserSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(2, "El nombre es obligatorio"),
  lastName: z.string().min(2, "El apellido es obligatorio"),
});
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});
export type LoginUserInput = z.infer<typeof LoginUserSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  lastName: z.string(),
  role: UserRoleSchema.default("MEMBER"),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ==========================================
// Provider Engine & OAuth Contracts
// ==========================================
export const ProviderTypeSchema = z.enum(["google", "microsoft"]);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const ConnectedAccountStatusSchema = z.enum([
  "active",
  "expired",
  "revoked",
  "rate_limited",
]);
export type ConnectedAccountStatus = z.infer<typeof ConnectedAccountStatusSchema>;

export const ConnectedAccountSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  provider: ProviderTypeSchema,
  status: ConnectedAccountStatusSchema,
  isDefault: z.boolean(),
  lastSyncAt: z.date().nullable(),
  createdAt: z.date(),
});
export type ConnectedAccountSummary = z.infer<typeof ConnectedAccountSummarySchema>;

// ==========================================
// Mail Engine Contracts
// ==========================================
export const MailFolderSchema = z.enum([
  "INBOX",
  "SENT",
  "DRAFT",
  "STARRED",
  "SPAM",
  "TRASH",
]);
export type MailFolder = z.infer<typeof MailFolderSchema>;

export const EmailAttachmentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  contentBase64: z.string().optional(),
});
export type EmailAttachment = z.infer<typeof EmailAttachmentSchema>;

export const EmailMessageSummarySchema = z.object({
  id: z.string(),
  threadId: z.string(),
  snippet: z.string(),
  subject: z.string(),
  from: z.string(),
  fromName: z.string(),
  fromEmail: z.string(),
  to: z.string(),
  date: z.string(),
  timestamp: z.number(),
  isUnread: z.boolean(),
  isStarred: z.boolean(),
  hasAttachments: z.boolean(),
  labels: z.array(z.string()),
});
export type EmailMessageSummary = z.infer<typeof EmailMessageSummarySchema>;

export const EmailMessageDetailSchema = EmailMessageSummarySchema.extend({
  cc: z.string().optional(),
  bcc: z.string().optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional(),
  attachments: z.array(EmailAttachmentSchema),
  inReplyTo: z.string().optional(),
  messageIdHeader: z.string().optional(),
});
export type EmailMessageDetail = z.infer<typeof EmailMessageDetailSchema>;

export const SendEmailSchema = z.object({
  accountId: z.string(),
  to: z.array(z.string().email("Correo de destinatario inválido")),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string(),
  bodyHtml: z.string(),
  bodyText: z.string().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        mimeType: z.string(),
        contentBase64: z.string(),
        size: z.number(),
      })
    )
    .optional(),
  threadId: z.string().optional(),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
});
export type SendEmailInput = z.infer<typeof SendEmailSchema>;

// ==========================================
// Calendar Engine Contracts
// ==========================================
export const CalendarEventSchema = z.object({
  id: z.string(),
  accountId: z.string().optional(),
  googleEventId: z.string().optional(),
  summary: z.string(),
  description: z.string().optional(),
  start: z.string(),
  end: z.string(),
  isAllDay: z.boolean().default(false),
  location: z.string().optional(),
  meetLink: z.string().optional(),
  htmlLink: z.string().optional(),
  attendees: z.array(z.object({ email: z.string().email() })).default([]),
  colorId: z.string().optional(),
  isLocal: z.boolean().default(false),
  createdAt: z.date().optional(),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const CreateCalendarEventSchema = z.object({
  accountId: z.string().optional(),
  summary: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  start: z.string().min(1, "Fecha de inicio obligatoria"),
  end: z.string().min(1, "Fecha de fin obligatoria"),
  isAllDay: z.boolean().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email("Correo de invitado inválido")).optional(),
  createMeetLink: z.boolean().optional(),
  colorId: z.string().optional(),
});
export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>;
