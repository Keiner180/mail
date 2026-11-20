import { db } from "../src/lib/db";

async function main() {
  console.log("Setting up SaaS Companies & Super Admin...");

  // 1. Promover el usuario principal a SUPER_ADMIN
  const superAdminEmail = "keinerjaramillo72@gmail.com";
  let user = await db.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (user) {
    user = await db.user.update({
      where: { id: user.id },
      data: { role: "SUPER_ADMIN" },
    });
    console.log(`User ${user.email} promoted to SUPER_ADMIN.`);
  } else {
    console.log(`User ${superAdminEmail} not found, searching other users...`);
    const anyUser = await db.user.findFirst();
    if (anyUser) {
      user = await db.user.update({
        where: { id: anyUser.id },
        data: { role: "SUPER_ADMIN" },
      });
      console.log(`User ${user.email} promoted to SUPER_ADMIN.`);
    }
  }

  if (!user) {
    console.log("No users found to promote.");
    return;
  }

  // 2. Crear la Empresa de demostración / producción si no existe
  let tenant = await db.tenant.findFirst({
    where: { slug: "tecnologia-lan" },
  });

  if (!tenant) {
    tenant = await db.tenant.create({
      data: {
        name: "Tecnología LAN",
        slug: "tecnologia-lan",
        tier: "PRO_10",
        maxAccounts: 10, // 10 cuentas de Google/Microsoft permitidas
        maxDailySends: 2500,
        status: "ACTIVE",
        contactEmail: user.email,
      },
    });
    console.log(`Created Company Tenant: ${tenant.name} (Plan: ${tenant.tier}, Max Accounts: ${tenant.maxAccounts})`);
  }

  // 3. Vincular el usuario a la Empresa
  await db.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  // 4. Vincular las cuentas de correo existentes a esta Empresa
  const updatedAccounts = await db.connectedAccount.updateMany({
    where: { userId: user.id },
    data: { tenantId: tenant.id },
  });

  console.log(`Linked ${updatedAccounts.count} connected accounts to company ${tenant.name}.`);
  console.log("SaaS Companies & Super Admin setup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
