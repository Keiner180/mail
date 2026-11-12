import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProvisioningEngine } from "@/lib/provisioning/engine";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Inicializar configuración y cuota si aún no existen
    await ProvisioningEngine.initializeUser(user.id);

    const [quota, accounts, userSettings] = await Promise.all([
      db.quotaAllocation.findUnique({
        where: { userId: user.id },
      }),
      db.connectedAccount.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          provider: true,
          status: true,
          isDefault: true,
          lastSyncAt: true,
          projectId: true,
          createdAt: true,
        },
      }),
      db.userSettings.findUnique({
        where: { userId: user.id },
      }),
    ]);

    // Calcular envíos de hoy
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const accountIds = accounts.map((a) => a.id);

    const sendsToday = await db.usageMetric.aggregate({
      where: {
        accountId: { in: accountIds },
        metricType: "EMAIL_SEND",
        timestamp: { gte: oneDayAgo },
      },
      _sum: { unitsConsumed: true },
    });

    const totalSent24h = sendsToday._sum.unitsConsumed || 0;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      settings: userSettings,
      quota: {
        maxConnectedAccounts: quota?.maxConnectedAccounts || 5,
        connectedAccountsCount: accounts.length,
        maxDailySends: quota?.maxDailySends || 500,
        sendsToday: totalSent24h,
        remainingSendsToday: Math.max(0, (quota?.maxDailySends || 500) - totalSent24h),
        maxStorageBytes: Number(quota?.maxStorageBytes || 10737418240n),
        currentStorageBytes: Number(quota?.currentStorageBytes || 0n),
      },
      accounts,
    });
  } catch (error: unknown) {
    console.error("Error fetching provisioning status:", error);
    return NextResponse.json(
      { error: "Error al consultar estado de aprovisionamiento" },
      { status: 500 }
    );
  }
}
