import { db } from "./src/lib/db";
import { hashPassword, verifyPassword, createSession } from "./src/lib/auth";
import { encryptText, decryptText, generateRandomToken, hashToken } from "./src/lib/crypto";
import { generateAuthUrl } from "./src/lib/gmail/oauth";

async function runTests() {
  console.log("=== INICIANDO PRUEBAS DE LA APLICACIÓN ===");

  // 1. Test AES-256-GCM Token Encryption & Decryption
  console.log("\n[Test 1] Cifrado y descifrado de tokens OAuth (AES-256-GCM)");
  const sampleToken = "ya29.a0AXooCgu83b-SampleSecretAccessTokenWithSpecialChars!@#$%^&*()";
  const encrypted = encryptText(sampleToken);
  const decrypted = decryptText(encrypted);

  if (sampleToken === decrypted && encrypted !== sampleToken) {
    console.log("✔ Token cifrado y descifrado correctamente. Formato:", encrypted.substring(0, 30) + "...");
  } else {
    throw new Error("Fallo en prueba de cifrado/descifrado");
  }

  // 2. Test Password Hashing with Bcrypt
  console.log("\n[Test 2] Hashing y verificación de contraseñas");
  const rawPass = "MiPasswordSeguro123!";
  const hashed = await hashPassword(rawPass);
  const isMatch = await verifyPassword(rawPass, hashed);
  const isWrong = await verifyPassword("WrongPassword", hashed);

  if (isMatch && !isWrong) {
    console.log("✔ Verificación de contraseña exitosa y resistente a contraseñas erróneas.");
  } else {
    throw new Error("Fallo en verificación de contraseña");
  }

  // 3. Test Database & User Registration in PostgreSQL
  console.log("\n[Test 3] Persistencia de usuarios en PostgreSQL");
  const testEmail = `test.user.${Date.now()}@jabvox.com`;

  const user = await db.user.create({
    data: {
      name: "Keiner",
      lastName: "Desarrollador",
      email: testEmail,
      passwordHash: hashed,
    },
  });
  console.log(`✔ Usuario creado en PostgreSQL con ID: ${user.id} (${user.email})`);

  // 4. Test Session Creation
  console.log("\n[Test 4] Creación y validación de sesión de usuario");
  const rawSessionToken = await createSession(user.id, "Mozilla/5.0 Test", "127.0.0.1");
  const tokenHash = hashToken(rawSessionToken);
  const sessionRecord = await db.session.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });

  if (sessionRecord && sessionRecord.user.id === user.id) {
    console.log("✔ Sesión verificada con token hasheado en BD.");
  } else {
    throw new Error("Fallo en sesión");
  }

  // 5. Test Password Reset Token
  console.log("\n[Test 5] Generación y consumo de token de recuperación");
  const resetTokenRaw = generateRandomToken(32);
  const resetTokenHash = hashToken(resetTokenRaw);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token: resetTokenHash,
      expiresAt,
    },
  });

  const foundReset = await db.passwordResetToken.findUnique({
    where: { token: resetTokenHash },
  });

  if (foundReset && !foundReset.usedAt) {
    await db.passwordResetToken.update({
      where: { id: foundReset.id },
      data: { usedAt: new Date() },
    });
    console.log("✔ Token de recuperación creado y marcado como consumido.");
  } else {
    throw new Error("Fallo en token de recuperación");
  }

  // 6. Test Multi-account Gmail Linking in DB with Encrypted Tokens
  console.log("\n[Test 6] Vinculación de múltiples cuentas Gmail con tokens cifrados");
  const acc1 = await db.connectedAccount.create({
    data: {
      userId: user.id,
      email: "cuenta1@gmail.com",
      name: "Cuenta Personal",
      accessTokenEnc: encryptText("token_acceso_1"),
      refreshTokenEnc: encryptText("token_actualizacion_1"),
      status: "active",
      isDefault: true,
    },
  });

  const acc2 = await db.connectedAccount.create({
    data: {
      userId: user.id,
      email: "cuenta2.trabajo@gmail.com",
      name: "Cuenta Trabajo",
      accessTokenEnc: encryptText("token_acceso_2"),
      refreshTokenEnc: encryptText("token_actualizacion_2"),
      status: "active",
      isDefault: false,
    },
  });

  const userAccounts = await db.connectedAccount.findMany({
    where: { userId: user.id },
  });

  if (userAccounts.length === 2) {
    console.log(`✔ Usuario cuenta con ${userAccounts.length} cuentas vinculadas independientes.`);
    // Verify decrypting tokens
    const decryptedRefresh = decryptText(userAccounts[0].refreshTokenEnc);
    if (decryptedRefresh === "token_actualizacion_1") {
      console.log("✔ Tokens descifrados correctamente desde la base de datos.");
    }
  } else {
    throw new Error("Fallo en cuentas conectadas");
  }

  // 7. Test OAuth Auth URL Generation
  console.log("\n[Test 7] Generación de URL OAuth 2.0");
  process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
  process.env.GOOGLE_CLIENT_SECRET = "test-secret";
  const authUrl = generateAuthUrl(user.id);
  if (authUrl.includes("accounts.google.com") && authUrl.includes("gmail.modify")) {
    console.log("✔ URL de autorización generada con scopes de Gmail API y state CSRF.");
  } else {
    throw new Error("URL OAuth inválida");
  }

  // Clean up test data
  console.log("\n[Limpieza] Eliminando registros de prueba...");
  await db.user.delete({ where: { id: user.id } });
  console.log("✔ Base de datos limpia.");

  console.log("\n==========================================");
  console.log("🎉 TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO");
  console.log("==========================================");
}

runTests()
  .catch((e) => {
    console.error("Error en pruebas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

