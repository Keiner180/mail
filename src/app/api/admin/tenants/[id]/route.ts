import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado: solo el Super Administrador puede actualizar planes de empresas." },
        { status: 403 }
      );
    }

    const { id: tenantId } = await params;
    const body = await req.json();
    const { name, tier, maxAccounts, maxDailySends, status } = body;

    const existingTenant = await db.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existingTenant) {
      return NextResponse.json({ error: "Empresa no encontrada." }, { status: 404 });
    }

    const updatedData: any = {};
    if (name) updatedData.name = name.trim();
    if (status) updatedData.status = status;
    if (tier) updatedData.tier = tier;

    if (maxAccounts !== undefined) {
      const parsed = Number(maxAccounts);
      updatedData.maxAccounts = parsed <= 0 ? -1 : parsed;
      // Auto-actualizar tier acorde
      if (updatedData.maxAccounts === -1) {
        updatedData.tier = "ENTERPRISE";
      } else if (updatedData.maxAccounts >= 25) {
        updatedData.tier = "BUSINESS_25";
      } else if (updatedData.maxAccounts >= 10) {
        updatedData.tier = "PRO_10";
      } else {
        updatedData.tier = "STARTER";
      }
    }

    if (maxDailySends !== undefined) {
      const parsedSends = Number(maxDailySends);
      updatedData.maxDailySends = parsedSends <= 0 ? -1 : parsedSends;
    }

    const updatedTenant = await db.tenant.update({
      where: { id: tenantId },
      data: updatedData,
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        tenantId: updatedTenant.id,
        action: "TENANT_UPDATED_BY_SUPERADMIN",
        metadataJson: JSON.stringify({
          updatedFields: updatedData,
          adminEmail: user.email,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Empresa "${updatedTenant.name}" actualizada con éxito. Plan: ${updatedTenant.tier}, Capacidad: ${
        updatedTenant.maxAccounts === -1 ? "Cuentas Ilimitadas (∞)" : `${updatedTenant.maxAccounts} cuentas`
      }.`,
      tenant: updatedTenant,
    });
  } catch (error: unknown) {
    console.error("Error updating tenant by Super Admin:", error);
    return NextResponse.json(
      { error: "Error al actualizar la empresa" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id: tenantId } = await params;

    await db.tenant.delete({
      where: { id: tenantId },
    });

    return NextResponse.json({
      success: true,
      message: "Empresa eliminada exitosamente.",
    });
  } catch (error: unknown) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json(
      { error: "Error al eliminar la empresa" },
      { status: 500 }
    );
  }
}
