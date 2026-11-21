import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ShieldAlert } from "lucide-react";
import AdminDashboardClient, { AdminOverviewData } from "@/components/admin/AdminDashboardClient";

export const metadata = {
  title: "Panel Super Admin | Jabvox Enterprise",
  description: "Monitoreo centralizado exclusivo para el Super Administrador de Jabvox",
};

export default async function AdminPage() {
  // 1. Verificación directa en el Servidor (Autenticación y Rol)
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth/login?from=/admin");
  }

  // 2. Control de Acceso Estricto por Rol en el Servidor
  if (user.role !== "SUPER_ADMIN" && user.role !== "PLATFORM_ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-100 border border-red-200 flex items-center justify-center mb-5 text-red-600 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Acceso Restringido</h1>
        <p className="text-sm text-gray-600 max-w-md mb-6 leading-relaxed">
          Este panel está reservado exclusivamente para el Super Administrador de Jabvox. Tu cuenta actual no cuenta con privilegios de nivel <code>SUPER_ADMIN</code>.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/mail"
            className="px-5 py-2.5 rounded-xl bg-[#15605A] text-white text-xs font-bold shadow-md hover:bg-[#124d48] transition-all"
          >
            Volver a mi Bandeja de Correo
          </Link>
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all"
          >
            Ver Mi Perfil
          </Link>
        </div>
      </div>
    );
  }

  // 3. Carga directa de datos desde PostgreSQL en el Servidor (Sin pasar por API)
  const [
    totalUsers,
    totalConnectedAccounts,
    googleAccountsCount,
    microsoftAccountsCount,
    activeAccountsCount,
    expiredOrErrorAccountsCount,
    totalCalendarEvents,
    activeSessionsCount,
    rawAccounts,
    rawUsers,
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

  const initialData: AdminOverviewData = {
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
    capacity: {
      model: "INCLUIDO_JABVOX",
      description: "El módulo de correo y calendario está 100% incluido en la suscripción de Jabvox.",
      userPolicy: "Cuentas multi-proveedor ilimitadas por usuario.",
      activePolicy: "Sin bloqueos artificiales ni pagos por buzón adicional.",
      maxSupportedUsers: "50,000+ usuarios concurrentes (arquitectura particionada con balanceo de cuotas).",
    },
    accounts: rawAccounts.map((a) => ({
      ...a,
      lastSyncAt: a.lastSyncAt ? a.lastSyncAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
      tokenExpiresAt: a.tokenExpiresAt ? a.tokenExpiresAt.toISOString() : null,
      oauthToken: a.oauthToken
        ? {
            keyId: a.oauthToken.keyId,
            expiresAt: a.oauthToken.expiresAt.toISOString(),
          }
        : null,
    })),
    users: rawUsers.map((u) => ({
      id: u.id,
      name: `${u.name} ${u.lastName}`.trim(),
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      connectedAccountsCount: u.accounts.length,
      accounts: u.accounts,
      allowedAccounts: "Ilimitadas (Plan Jabvox)",
    })),
  };

  return <AdminDashboardClient initialData={initialData} />;
}
