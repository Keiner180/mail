import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado: solo el Super Administrador puede gestionar empresas y planes." },
        { status: 403 }
      );
    }

    const [tenants, totalAccounts, totalUsers] = await Promise.all([
      db.tenant.findMany({
        include: {
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          connectedAccounts: {
            select: {
              id: true,
              email: true,
              provider: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.connectedAccount.count(),
      db.user.count(),
    ]);

    const formattedTenants = tenants.map((t) => {
      const activeAccountsCount = t.connectedAccounts.filter(
        (a) => a.status === "active" || a.status === "rate_limited"
      ).length;

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        tier: t.tier,
        maxAccounts: t.maxAccounts,
        isUnlimited: t.maxAccounts === -1,
        maxDailySends: t.maxDailySends,
        contactEmail: t.contactEmail,
        createdAt: t.createdAt,
        owner: t.memberships[0]?.user || null,
        totalMembers: t.memberships.length,
        connectedAccountsCount: activeAccountsCount,
        connectedAccounts: t.connectedAccounts,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalTenants: tenants.length,
        totalAccounts,
        totalUsers,
      },
      tenants: formattedTenants,
    });
  } catch (error: unknown) {
    console.error("Error fetching tenants for Super Admin:", error);
    return NextResponse.json(
      { error: "Error al consultar empresas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado: solo el Super Administrador puede crear empresas." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, ownerEmail, tier, maxAccounts, maxDailySends } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre de la empresa es obligatorio (mínimo 2 caracteres)." },
        { status: 400 }
      );
    }

    // Buscar o verificar el usuario propietario
    let ownerUser = null;
    if (ownerEmail) {
      ownerUser = await db.user.findUnique({
        where: { email: ownerEmail.trim().toLowerCase() },
      });
      if (!ownerUser) {
        return NextResponse.json(
          { error: `No se encontró ningún usuario registrado con el correo: ${ownerEmail}` },
          { status: 404 }
        );
      }
    } else {
      ownerUser = await db.user.findUnique({ where: { id: user.id } });
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
    const parsedMaxAccounts = maxAccounts !== undefined ? Number(maxAccounts) : 10;
    const parsedDailySends = maxDailySends !== undefined ? Number(maxDailySends) : 2500;

    const tenant = await db.tenant.create({
      data: {
        name: name.trim(),
        slug,
        tier: tier || (parsedMaxAccounts === -1 ? "ENTERPRISE" : "PRO_10"),
        maxAccounts: parsedMaxAccounts,
        maxDailySends: parsedDailySends,
        status: "ACTIVE",
        contactEmail: ownerUser ? ownerUser.email : user.email,
        memberships: ownerUser
          ? {
              create: {
                userId: ownerUser.id,
                role: "OWNER",
              },
            }
          : undefined,
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        action: "TENANT_CREATED_BY_ADMIN",
        metadataJson: JSON.stringify({
          tenantId: tenant.id,
          name: tenant.name,
          maxAccounts: tenant.maxAccounts,
          createdBy: user.email,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Empresa "${tenant.name}" creada exitosamente con capacidad para ${
        tenant.maxAccounts === -1 ? "cuentas ilimitadas" : `${tenant.maxAccounts} cuentas`
      }.`,
      tenant,
    });
  } catch (error: unknown) {
    console.error("Error creating tenant by Super Admin:", error);
    return NextResponse.json(
      { error: "Error al crear la empresa" },
      { status: 500 }
    );
  }
}
