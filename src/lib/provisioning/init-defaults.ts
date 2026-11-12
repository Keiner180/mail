import { db } from "@/lib/db";
import { encryptText } from "@/lib/crypto";

/**
 * Initializes default Master Provider Applications (Modelo A) and ensures
 * system invariants are met without impacting existing accounts.
 */
export async function initializeDefaultProviderApps() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (googleClientId && googleClientSecret) {
    const existingGoogle = await db.providerApplication.findFirst({
      where: {
        provider: "GOOGLE",
        clientId: googleClientId,
      },
    });

    if (!existingGoogle) {
      const encryptedSecret = encryptText(googleClientSecret);
      await db.providerApplication.create({
        data: {
          provider: "GOOGLE",
          applicationType: "MANAGED_MASTER",
          name: "Jabvox Google Production Master",
          clientId: googleClientId,
          clientSecretEnc: encryptedSecret,
          redirectUri: `${appUrl}/api/auth/google/callback`,
          isVerified: true,
          maxAccountLimit: 10000,
        },
      });
      console.log("[Provisioning] Master Google Provider Application initialized.");
    }
  }

  const msClientId = process.env.MICROSOFT_CLIENT_ID;
  const msClientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (msClientId && msClientSecret) {
    const existingMs = await db.providerApplication.findFirst({
      where: {
        provider: "MICROSOFT",
        clientId: msClientId,
      },
    });

    if (!existingMs) {
      const encryptedSecret = encryptText(msClientSecret);
      await db.providerApplication.create({
        data: {
          provider: "MICROSOFT",
          applicationType: "MANAGED_MASTER",
          name: "Jabvox Microsoft Production Master",
          clientId: msClientId,
          clientSecretEnc: encryptedSecret,
          redirectUri: `${appUrl}/api/auth/microsoft/callback`,
          isVerified: true,
          maxAccountLimit: 10000,
        },
      });
      console.log("[Provisioning] Master Microsoft Provider Application initialized.");
    }
  }
}
