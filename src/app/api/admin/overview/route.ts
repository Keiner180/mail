import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado: solo el Super Administrador puede acceder a esta información." },
        { status: 403 }
      );
    }

    // 1. Estadísticas globales
    const [
      totalUsers,
      totalConnectedAccounts,
      googleAccountsCount,
      microsoftAccountsCount,
      activeAccountsCount,
      expiredOrErrorAccountsCount,
      totalCalendarEvents,
      activeSessionsCount,
      accounts,
      users,
    ] = await Promise.all([
      db.user.count(),
      db.connectedAccount.count(),
      db.connectedAccount.count({ where: { provider: "google" } }),
      db.connectedAccount.count({ where: { provider: "microsoft" } }),
      db.connectedAccount.count({ where: { status: "active" } }),
      db.connectedAccount.count({ where: { status: { in: ["expired", "revoked", "error"] } } }),
      db.calendarEvent.count(),
      db.session.count({ where: { expiresAt: { gt: new Date() } } }),
      db.connectedAccount.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          provider: true,
          status: true,
          isDefault: true,
          lastSyncAt: true,
          createdAt: true,
          tokenExpiresAt: true,
          user: {
            select: {
              id: true,
              name: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          oauthToken: {
            select: {
              keyId: true,
              expiresAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.user.findMany({
        select: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          accounts: {
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
    ]);

    // 2. Información de disponibilidad de servicios
    const services = [
      {
        id: "gmail",
        name: "Gmail API v1",
        provider: "Google Cloud",
        status: "OPERATIONAL",
        description: "Lectura, sincronización por historial y envío de correos corporativos/personales",
        quotaInfo: "15,000 req/día base por proyecto (250 unidades/s límite por usuario)",
        encryption: "AES-256-GCM Envelope",
      },
      {
        id: "calendar",
        name: "Google Calendar API v3",
        provider: "Google Cloud",
        status: "OPERATIONAL",
        description: "Gestión de eventos, zonas horarias y sincronización de agenda",
        quotaInfo: "1,000,000 req/día",
        encryption: "AES-256-GCM Envelope",
      },
      {
        id: "meet",
        name: "Google Meet API",
        provider: "Google Cloud",
        status: "OPERATIONAL",
        description: "Creación instantánea de videollamadas y salas de conferencias",
        quotaInfo: "Disponible bajo demanda por evento",
        encryption: "AES-256-GCM Envelope",
      },
      {
        id: "graph",
        name: "Microsoft Graph API",
        provider: "Microsoft Entra ID",
        status: "OPERATIONAL",
        description: "Buzón de correo Outlook, Hotmail, Office 365 y calendario Microsoft",
        quotaInfo: "10,000 req / 10 minutos por tenant",
        encryption: "AES-256-GCM Envelope",
      },
      {
        id: "postgres",
        name: "PostgreSQL 16 (Relacional)",
        provider: "Infraestructura Jabvox",
        status: "OPERATIONAL",
        description: "Almacenamiento persistente, aislamiento multi-tenant y transacciones ACID",
        quotaInfo: "Puerto 5433 | Conexión activa",
        encryption: "TLS / At-rest",
      },
    ];

    // 3. Resumen de capacidad
    const capacity = {
      model: "INCLUIDO_JABVOX",
      description: "El módulo de correo y calendario está 100% incluido en la suscripción de Jabvox.",
      userPolicy: "Cuentas multi-proveedor ilimitadas por usuario.",
      activePolicy: "Sin bloqueos artificiales ni pagos por buzón adicional.",
      maxSupportedUsers: "50,000+ usuarios concurrentes (arquitectura particionada con balanceo de cuotas).",
    };

    return NextResponse.json({
      success: true,
      currentUser: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      stats: {
        totalUsers,
        totalConnectedAccounts,
        googleAccountsCount,
        microsoftAccountsCount,
        activeAccountsCount,
        expiredOrErrorAccountsCount,
        totalCalendarEvents,
        activeSessionsCount,
      },
      services,
      capacity,
      accounts,
      users: users.map((u) => ({
        id: u.id,
        name: `${u.name} ${u.lastName}`.trim(),
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        connectedAccountsCount: u.accounts.length,
        accounts: u.accounts,
        allowedAccounts: "Ilimitadas (Plan Jabvox)",
      })),
    });
  } catch (error: unknown) {
    console.error("Error in admin overview API:", error);
    return NextResponse.json(
      { error: "Error interno al consultar el panel de administración" },
      { status: 500 }
    );
  }
}
