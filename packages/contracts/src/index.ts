import { z } from "zod";

// ==========================================
// User & Auth Contracts
// ==========================================
export const GlobalRoleSchema = z.enum(["USER", "PLATFORM_ADMIN", "SUPPORT_AGENT"]);
export type GlobalRole = z.infer<typeof GlobalRoleSchema>;

export const UserAccountStatusSchema = z.enum([
  "PENDING_ACTIVATION",
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
]);
export type UserAccountStatus = z.infer<typeof UserAccountStatusSchema>;

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
  avatar: z.string().nullable().optional(),
  role: GlobalRoleSchema.default("USER"),
  status: UserAccountStatusSchema.default("ACTIVE"),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ==========================================
// Multi-Tenant & Organization Contracts
// ==========================================
export const TenantRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);
export type TenantRole = z.infer<typeof TenantRoleSchema>;

export const TenantStatusSchema = z.enum([
  "TRIAL",
  "ACTIVE",
  "PAST_DUE",
  "SUSPENDED",
  "CANCELLED",
]);
export type TenantStatus = z.infer<typeof TenantStatusSchema>;

export const SubscriptionTierSchema = z.enum([
  "FREE",
  "STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
]);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const CreateTenantSchema = z.object({
  name: z.string().min(2, "El nombre de la empresa es requerido"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug inválido"),
});
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

// ==========================================
// Projects & BYO-Cloud Provider Apps
// ==========================================
export const ProjectStatusSchema = z.enum([
  "INITIALIZING",
  "ACTIVE",
  "SUSPENDED",
  "DISABLED",
]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const AppDeploymentTypeSchema = z.enum([
  "MANAGED_MASTER",
  "MANAGED_POOL",
  "CUSTOM_BYO",
]);
export type AppDeploymentType = z.infer<typeof AppDeploymentTypeSchema>;

export const RegisterProviderAppSchema = z.object({
  projectId: z.string().optional(),
  provider: z.enum(["GOOGLE", "MICROSOFT"]),
  applicationType: AppDeploymentTypeSchema.default("CUSTOM_BYO"),
  name: z.string().min(2, "Nombre de la aplicación requerido"),
  clientId: z.string().min(5, "Client ID obligatorio"),
  clientSecret: z.string().min(5, "Client Secret obligatorio"),
  redirectUri: z.string().url("URL de redirección inválida"),
});
export type RegisterProviderAppInput = z.infer<typeof RegisterProviderAppSchema>;

// ==========================================
// Provider Engine & Connected Accounts
// ==========================================
export const ProviderTypeSchema = z.enum(["google", "microsoft"]);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const ConnectedAccountStatusSchema = z.enum([
  "active",
  "expired",
  "revoked",
  "error",
  "rate_limited",
]);
export type ConnectedAccountStatus = z.infer<typeof ConnectedAccountStatusSchema>;

export const ConnectedAccountSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string().nullable().optional(),
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
// Provisioning Engine Contracts
// ==========================================
export const ProvisioningJobStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "DEAD_LETTER",
]);
export type ProvisioningJobStatus = z.infer<typeof ProvisioningJobStatusSchema>;

export const ProvisionAccountInputSchema = z.object({
  userId: z.string(),
  provider: ProviderTypeSchema,
  authCode: z.string(),
  redirectUri: z.string(),
  providerAppId: z.string().optional(),
  projectId: z.string().optional(),
});
export type ProvisionAccountInput = z.infer<typeof ProvisionAccountInputSchema>;

// ==========================================
// Quotas & Usage Metrics
// ==========================================
export const QuotaAllocationSchema = z.object({
  userId: z.string(),
  maxConnectedAccounts: z.number().default(3),
  maxDailySends: z.number().default(300),
  maxStorageBytes: z.bigint().default(BigInt(5368709120)),
  currentStorageBytes: z.bigint().default(BigInt(0)),
});
export type QuotaAllocation = z.infer<typeof QuotaAllocationSchema>;

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
