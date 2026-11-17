import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProvisioningEngine } from "@/lib/provisioning/engine";

const SAAS_PLANS = [
  {
    id: "STARTER",
    name: "Plan Starter (Básico)",
    maxAccounts: 2,
    maxDailySends: 150,
    storageGB: 5,
    description: "Ideal para profesionales individuales o pruebas.",
    isPopular: false,
  },
  {
    id: "PRO_10",
    name: "Plan Pyme & Equipos (10 Cuentas)",
    maxAccounts: 10,
    maxDailySends: 2500,
    storageGB: 50,
    description: "Conecta hasta 10 cuentas de Google o Microsoft para tu empresa.",
    isPopular: true,
  },
  {
    id: "BUSINESS_25",
    name: "Plan Business (25 Cuentas)",
    maxAccounts: 25,
    maxDailySends: 10000,
    storageGB: 150,
    description: "Para empresas en crecimiento con hasta 25 bandejas activas.",
    isPopular: false,
  },
  {
    id: "ENTERPRISE",
    name: "Plan Enterprise (Cuentas Ilimitadas)",
    maxAccounts: -1, // -1 representa Ilimitado
    maxDailySends: -1,
    storageGB: 1000,
    description: "Cuentas y envíos ilimitados para operaciones corporativas masivas.",
    isPopular: false,
  },
];

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await ProvisioningEngine.initializeUser(user.id);

    const [quota, connectedCount, tenantMembership] = await Promise.all([
      db.quotaAllocation.findUnique({
        where: { userId: user.id },
      }),
      db.connectedAccount.count({
        where: { userId: user.id, status: { in: ["active", "rate_limited"] } },
      }),
      db.tenantMembership.findFirst({
        where: { userId: user.id },
        include: { tenant: true },
      }),
    ]);

    // Determinar plan actual basado en maxConnectedAccounts
    const maxAcc = quota?.maxConnectedAccounts ?? 5;
    let currentPlanId = "STARTER";
    if (maxAcc === -1) {
      currentPlanId = "ENTERPRISE";
    } else if (maxAcc >= 25) {
      currentPlanId = "BUSINESS_25";
    } else if (maxAcc >= 10) {
      currentPlanId = "PRO_10";
    }

    return NextResponse.json({
      success: true,
      currentPlan: {
        planId: currentPlanId,
        maxAccounts: maxAcc,
        isUnlimited: maxAcc === -1,
        maxDailySends: quota?.maxDailySends ?? 500,
        connectedCount,
        remainingAccounts: maxAcc === -1 ? "Ilimitadas" : Math.max(0, maxAcc - connectedCount),
      },
      tenant: tenantMembership?.tenant || {
        name: `Espacio de ${user.name}`,
        tier: currentPlanId,
      },
      availablePlans: SAAS_PLANS,
    });
  } catch (error: unknown) {
    console.error("Error fetching SaaS plans:", error);
    return NextResponse.json(
      { error: "Error al obtener planes" },
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

    const body = await req.json();
    const { planId, customAccountsLimit } = body;

    let targetMaxAccounts = 5;
    let targetDailySends = 500;
    let targetStorageBytes = BigInt(10 * 1024 * 1024 * 1024);

    if (customAccountsLimit !== undefined) {
      // Ajuste manual de cuota (por ejemplo fijar exactamente 10 o ilimitado -1)
      const parsed = Number(customAccountsLimit);
      targetMaxAccounts = parsed <= 0 ? -1 : parsed;
      targetDailySends = parsed <= 0 ? -1 : parsed * 250;
    } else if (planId) {
      const selected = SAAS_PLANS.find((p) => p.id === planId);
      if (selected) {
        targetMaxAccounts = selected.maxAccounts;
        targetDailySends = selected.maxDailySends;
        targetStorageBytes = BigInt(selected.storageGB * 1024 * 1024 * 1024);
      }
    }

    const updatedQuota = await db.quotaAllocation.upsert({
      where: { userId: user.id },
      update: {
        maxConnectedAccounts: targetMaxAccounts,
        maxDailySends: targetDailySends,
        maxStorageBytes: targetStorageBytes,
      },
      create: {
        userId: user.id,
        maxConnectedAccounts: targetMaxAccounts,
        maxDailySends: targetDailySends,
        maxStorageBytes: targetStorageBytes,
      },
    });

    // Registrar en auditoría
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "PLAN_UPDATED",
        metadataJson: JSON.stringify({
          planId: planId || "CUSTOM",
          maxConnectedAccounts: targetMaxAccounts,
          updatedBy: user.email,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        targetMaxAccounts === -1
          ? "¡Plan actualizado exitosamente con cuentas ilimitadas!"
          : `¡Plan actualizado exitosamente para soportar hasta ${targetMaxAccounts} cuentas!`,
      quota: {
        maxConnectedAccounts: updatedQuota.maxConnectedAccounts,
        isUnlimited: updatedQuota.maxConnectedAccounts === -1,
      },
    });
  } catch (error: unknown) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Error al actualizar el plan" },
      { status: 500 }
    );
  }
}
