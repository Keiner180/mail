import crypto from "crypto";
import { db } from "@/lib/db";
import { encryptText, decryptText } from "@/lib/crypto";

export interface BindAccountParams {
  userId: string;
  provider: "google" | "microsoft";
  email: string;
  name?: string | null;
  avatar?: string | null;
  accessToken: string;
  refreshToken: string;
  scope?: string | null;
  tokenExpiresAt?: Date | null;
  projectId?: string | null;
  providerAppId?: string | null;
}

export class ProvisioningEngine {
  /**
   * Asegura que el usuario tenga configuración por defecto y cuota asignada
   */
  static async initializeUser(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { settings: true, quotaAllocation: true },
    });

    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado.`);
    }

    if (!user.settings) {
      await db.userSettings.create({
        data: {
          userId,
          timeZone: "America/Bogota",
          language: "es",
          theme: "light",
          autoSyncIntervalSec: 300,
        },
      });
    }

    if (!user.quotaAllocation) {
      await db.quotaAllocation.create({
        data: {
          userId,
          maxConnectedAccounts: 10,
          maxDailySends: 2500,
          maxStorageBytes: BigInt(50 * 1024 * 1024 * 1024), // 50 GB
          currentStorageBytes: BigInt(0),
        },
      });
    }

    // Asegurar que el usuario pertenezca a una Empresa (Tenant)
    const membership = await db.tenantMembership.findFirst({
      where: { userId },
      include: { tenant: true },
    });

    if (!membership) {
      const slug = `empresa-${user.id.slice(-6)}-${Date.now().toString(36)}`;
      const tenant = await db.tenant.create({
        data: {
          name: `Empresa de ${user.name} ${user.lastName}`.trim(),
          slug,
          tier: "PRO_10",
          maxAccounts: 10, // 10 cuentas de Google/Microsoft por defecto
          maxDailySends: 2500,
          status: "ACTIVE",
          contactEmail: user.email,
        },
      });

      await db.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId,
          role: "OWNER",
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId,
        action: "USER_INITIALIZED",
        metadataJson: JSON.stringify({ initializedAt: new Date() }),
      },
    });

    return true;
  }

  /**
   * Resuelve la aplicación OAuth apropiada (BYO del proyecto, Pool balanceado o Master global)
   */
  static async resolveProviderApp(
    provider: "GOOGLE" | "MICROSOFT",
    projectId?: string | null
  ) {
    // 1. Si hay un proyecto con credenciales BYO propias
    if (projectId) {
      const byoApp = await db.providerApplication.findFirst({
        where: {
          projectId,
          provider,
          applicationType: "CUSTOM_BYO",
          isVerified: true,
        },
      });
      if (byoApp) return byoApp;
    }

    // 2. Si hay una app en el Pool administrado con capacidad disponible
    const pooledApp = await db.providerApplication.findFirst({
      where: {
        provider,
        applicationType: "MANAGED_POOL",
        isVerified: true,
        currentAccountCount: { lt: db.providerApplication.fields.maxAccountLimit },
      },
      orderBy: { currentAccountCount: "asc" },
    });
    if (pooledApp) return pooledApp;

    // 3. Fallback a la aplicación Maestra oficial
    let masterApp = await db.providerApplication.findFirst({
      where: {
        provider,
        applicationType: "MANAGED_MASTER",
      },
    });

    if (!masterApp) {
      if (provider === "MICROSOFT" && process.env.MICROSOFT_CLIENT_ID) {
        masterApp = await db.providerApplication.create({
          data: {
            provider: "MICROSOFT",
            applicationType: "MANAGED_MASTER",
            name: "Microsoft Master Application",
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecretEnc: encryptText(process.env.MICROSOFT_CLIENT_SECRET || ""),
            redirectUri:
              process.env.MICROSOFT_REDIRECT_URI ||
              "http://localhost:3005/api/auth/microsoft/callback",
            isVerified: true,
          },
        });
      } else if (provider === "GOOGLE" && process.env.GOOGLE_CLIENT_ID) {
        masterApp = await db.providerApplication.create({
          data: {
            provider: "GOOGLE",
            applicationType: "MANAGED_MASTER",
            name: "Google Master Application",
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecretEnc: encryptText(process.env.GOOGLE_CLIENT_SECRET || ""),
            redirectUri:
              process.env.GOOGLE_REDIRECT_URI ||
              "http://localhost:3005/api/auth/google/callback",
            isVerified: true,
          },
        });
      }
    }

    if (!masterApp) {
      throw new Error(
        `No hay una aplicación registrada para el proveedor ${provider}. Verifique la configuración del sistema.`
      );
    }

    return masterApp;
  }

  /**
   * Valida que el usuario pueda conectar cuentas o enviar correos
   * (Incluido libremente en la suscripción de Jabvox sin límites artificiales)
   */
  static async assertQuota(
    userId: string,
    action: "CONNECT_ACCOUNT" | "SEND_EMAIL"
  ): Promise<boolean> {
    return true;
  }

  /**
   * Vincula una cuenta de correo a un usuario de forma atómica con cifrado AES-256
   */
  static async bindAccount(params: BindAccountParams) {
    await this.assertQuota(params.userId, "CONNECT_ACCOUNT");

    const providerEnum = params.provider === "google" ? "GOOGLE" : "MICROSOFT";
    const app =
      params.providerAppId
        ? await db.providerApplication.findUnique({
            where: { id: params.providerAppId },
          })
        : await this.resolveProviderApp(providerEnum, params.projectId);

    if (!app) {
      throw new Error("No se pudo resolver la aplicación proveedora.");
    }

    // Cifrado simétrico AES-256-GCM para tokens
    const encAccessToken = encryptText(params.accessToken);
    const encRefreshToken = encryptText(params.refreshToken);

    // Vector de inicialización y tag para OAuthToken
    const iv = crypto.randomBytes(12).toString("hex");
    const tag = crypto.randomBytes(16).toString("hex");

    const existingDefault = await db.connectedAccount.findFirst({
      where: { userId: params.userId, isDefault: true },
    });

    const isFirstAccount = !existingDefault;

    // Obtener la empresa del usuario
    const userMembership = await db.tenantMembership.findFirst({
      where: { userId: params.userId },
    });
    const tenantId = userMembership?.tenantId || null;

    // Transacción atómica
    const account = await db.$transaction(async (tx) => {
      const existingAccount = await tx.connectedAccount.findUnique({
        where: {
          userId_provider_email: {
            userId: params.userId,
            provider: params.provider,
            email: params.email,
          },
        },
      });

      const effectiveRefreshTokenEnc = encRefreshToken || existingAccount?.refreshTokenEnc || "";

      const createdAccount = await tx.connectedAccount.upsert({
        where: {
          userId_provider_email: {
            userId: params.userId,
            provider: params.provider,
            email: params.email,
          },
        },
        update: {
          provider: params.provider,
          name: params.name || undefined,
          avatar: params.avatar || undefined,
          accessTokenEnc: encAccessToken,
          refreshTokenEnc: effectiveRefreshTokenEnc,
          scope: params.scope || undefined,
          tokenExpiresAt: params.tokenExpiresAt || undefined,
          status: "active",
          lastSyncError: null,
          tenantId: tenantId || undefined,
          providerAppId: app.id,
          projectId: params.projectId || undefined,
        },
        create: {
          userId: params.userId,
          tenantId: tenantId || null,
          provider: params.provider,
          email: params.email,
          name: params.name || null,
          avatar: params.avatar || null,
          accessTokenEnc: encAccessToken,
          refreshTokenEnc: effectiveRefreshTokenEnc,
          scope: params.scope || null,
          tokenExpiresAt: params.tokenExpiresAt || null,
          status: "active",
          isDefault: isFirstAccount,
          providerAppId: app.id,
          projectId: params.projectId || null,
        },
      });

      // Crear o actualizar registro normalizado OAuthToken
      await tx.oAuthToken.upsert({
        where: { accountId: createdAccount.id },
        update: {
          accessTokenEnc: encAccessToken,
          refreshTokenEnc: effectiveRefreshTokenEnc,
          scope: params.scope || "",
          expiresAt: params.tokenExpiresAt || new Date(Date.now() + 3600 * 1000),
          encryptionIv: iv,
          encryptionTag: tag,
          keyId: "v1",
        },
        create: {
          accountId: createdAccount.id,
          accessTokenEnc: encAccessToken,
          refreshTokenEnc: effectiveRefreshTokenEnc,
          scope: params.scope || "",
          expiresAt: params.tokenExpiresAt || new Date(Date.now() + 3600 * 1000),
          encryptionIv: iv,
          encryptionTag: tag,
          keyId: "v1",
        },
      });

      // Incrementar contador de cuentas en la aplicación proveedora
      await tx.providerApplication.update({
        where: { id: app.id },
        data: { currentAccountCount: { increment: 1 } },
      });

      // Registrar métrica de auditoría
      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: "ACCOUNT_CONNECTED",
          metadataJson: JSON.stringify({
            accountId: createdAccount.id,
            email: params.email,
            provider: params.provider,
            providerAppId: app.id,
            appType: app.applicationType,
          }),
        },
      });

      return createdAccount;
    });

    return account;
  }

  /**
   * Registra una métrica de consumo
   */
  static async recordUsage(
    accountId: string,
    metricType: "EMAIL_FETCH" | "EMAIL_SEND" | "CALENDAR_SYNC" | "MEET_CREATE",
    units = 1
  ) {
    try {
      await db.usageMetric.create({
        data: {
          accountId,
          metricType,
          unitsConsumed: units,
        },
      });
    } catch (e) {
      console.error("[ProvisioningEngine] Error grabando métrica:", e);
    }
  }
}
