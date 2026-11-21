"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Mail,
  RefreshCw,
  Search,
  CheckCircle2,
  Calendar,
  Lock,
  Sparkles,
  Server,
  Cloud,
  Check,
  Sliders,
} from "lucide-react";

export interface AdminOverviewData {
  currentUser: {
    id: string;
    name: string;
    lastName: string;
    email: string;
    role: string;
  };
  stats: {
    totalUsers: number;
    totalConnectedAccounts: number;
    googleAccountsCount: number;
    microsoftAccountsCount: number;
    activeAccountsCount: number;
    expiredOrErrorAccountsCount: number;
    totalCalendarEvents: number;
    activeSessionsCount: number;
  };
  services: Array<{
    id: string;
    name: string;
    provider: string;
    status: string;
    description: string;
    quotaInfo: string;
    encryption: string;
  }>;
  capacity: {
    model: string;
    description: string;
    userPolicy: string;
    activePolicy: string;
    maxSupportedUsers: string;
  };
  accounts: Array<{
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    provider: string;
    status: string;
    isDefault: boolean;
    lastSyncAt: string | null;
    createdAt: string;
    tokenExpiresAt: string | null;
    user: {
      id: string;
      name: string;
      lastName: string;
      email: string;
      role: string;
    };
    oauthToken: {
      keyId: string;
      expiresAt: string;
    } | null;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    connectedAccountsCount: number;
    accounts: Array<{
      id: string;
      email: string;
      provider: string;
      status: string;
    }>;
    allowedAccounts: string;
  }>;
}

export default function AdminDashboardClient({ initialData }: { initialData: AdminOverviewData }) {
  const router = useRouter();
  const [data, setData] = useState<AdminOverviewData>(initialData);
  const [activeTab, setActiveTab] = useState<"accounts" | "users" | "services" | "quotas">("accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<"all" | "google" | "microsoft">("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  // Filtrado de cuentas
  const filteredAccounts = data.accounts.filter((acc) => {
    const matchesSearch =
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.name && acc.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      acc.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${acc.user.name} ${acc.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider = providerFilter === "all" || acc.provider.toLowerCase() === providerFilter;

    return matchesSearch && matchesProvider;
  });

  // Filtrado de usuarios
  const filteredUsers = data.users.filter((u) => {
    return (
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#15605A] to-[#0d3f3b] flex items-center justify-center text-white shadow-md shadow-[#15605A]/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-gray-900">JABVOX</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-[#15605A] border border-emerald-300">
                  Super Admin
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Exclusivo por Autenticación</span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Panel central de disponibilidad, capacidad y cuentas vinculadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-all text-xs font-semibold flex items-center gap-1.5"
              title="Refrescar métricas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#15605A]" : ""}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <Link
              href="/mail"
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-all text-xs font-bold flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-gray-600" />
              <span>Ir al Webmail</span>
            </Link>

            <Link
              href="/calendar"
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-all text-xs font-bold flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Calendario</span>
            </Link>

            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-7 h-7 rounded-xl bg-[#15605A] text-white flex items-center justify-center text-xs font-bold">
                {data.currentUser.name[0]}
              </div>
              <div className="text-left text-[11px]">
                <div className="font-bold text-gray-800 leading-none">{data.currentUser.name}</div>
                <div className="text-[10px] text-emerald-600 font-semibold">{data.currentUser.role}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-6">
        {/* Banner Explicativo */}
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-[#15605A] shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-[#15605A]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Acceso Verificado por Autenticación de Super Admin (Auth)
              </h2>
              <p className="text-xs text-gray-600 mt-0.5 max-w-3xl leading-relaxed">
                Este panel está protegido directamente en el servidor mediante tu sesión autenticada con rol <strong>SUPER_ADMIN</strong>. Aquí puedes monitorear todas las cuentas de Gmail y Outlook vinculadas por los usuarios mediante el flujo oficial de autenticación (OAuth), revisar el estado de los servicios y verificar la capacidad ilimitada incluida en el plan mensual de Jabvox.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-[11px] font-bold text-emerald-800 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Cuentas Ilimitadas por Usuario
            </span>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Cuentas Vinculadas */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cuentas Vinculadas</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#15605A] flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 tracking-tight">
                {data.stats.totalConnectedAccounts}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                {data.stats.activeAccountsCount} activas
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> Google: {data.stats.googleAccountsCount}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Outlook: {data.stats.microsoftAccountsCount}
              </span>
            </div>
          </div>

          {/* Card 2: Usuarios Registrados */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Usuarios Registrados</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 tracking-tight">
                {data.stats.totalUsers}
              </span>
              <span className="text-xs font-semibold text-blue-600">
                {data.stats.activeSessionsCount} sesiones activas
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
              Promedio: {(data.stats.totalConnectedAccounts / (data.stats.totalUsers || 1)).toFixed(1)} cuentas / usuario
            </div>
          </div>

          {/* Card 3: Disponibilidad de Servicios */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Disponibilidad Servicios</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 tracking-tight">
                {data.services.filter((s) => s.status === "OPERATIONAL").length}/{data.services.length}
              </span>
              <span className="text-xs font-semibold text-emerald-600">100% Operativo</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
              Google Cloud & Entra ID conectadas
            </div>
          </div>

          {/* Card 4: Seguridad & Capacidad */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seguridad Tokens</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-gray-900 tracking-tight">
                AES-256-GCM
              </span>
              <span className="text-xs font-semibold text-purple-600">Envelope</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
              IV dinámico por cuenta | Sin fuga de tokens
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "accounts"
                ? "bg-[#15605A] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Cuentas Vinculadas ({data.stats.totalConnectedAccounts})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "users"
                ? "bg-[#15605A] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios & Capacidad ({data.stats.totalUsers})</span>
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "services"
                ? "bg-[#15605A] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Servicios & Disponibilidad ({data.services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("quotas")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "quotas"
                ? "bg-[#15605A] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Límites & Cuotas del Sistema</span>
          </button>
        </div>

        {/* TAB 1: CUENTAS VINCULADAS */}
        {activeTab === "accounts" && (
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por correo o propietario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#15605A]/20 focus:border-[#15605A]"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setProviderFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    providerFilter === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Todas ({data.accounts.length})
                </button>
                <button
                  onClick={() => setProviderFilter("google")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                    providerFilter === "google"
                      ? "bg-red-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  Google ({data.stats.googleAccountsCount})
                </button>
                <button
                  onClick={() => setProviderFilter("microsoft")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                    providerFilter === "microsoft"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Outlook ({data.stats.microsoftAccountsCount})
                </button>
              </div>
            </div>

            {/* Accounts Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200 text-[10px]">
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Cuenta Conectada</th>
                    <th className="py-3 px-4">Usuario Propietario (Jabvox)</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Cifrado de Token</th>
                    <th className="py-3 px-4">Fecha Vinculación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-400 text-xs">
                        No se encontraron cuentas que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Provider */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                              acc.provider === "microsoft"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                acc.provider === "microsoft" ? "bg-blue-600" : "bg-red-600"
                              }`}
                            ></span>
                            {acc.provider === "microsoft" ? "Microsoft Graph" : "Google Cloud"}
                          </span>
                        </td>

                        {/* Connected Email */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {acc.avatar ? (
                              <img
                                src={acc.avatar}
                                alt={acc.email}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div
                                className={`w-6 h-6 rounded-lg text-white font-bold text-[10px] flex items-center justify-center ${
                                  acc.provider === "microsoft" ? "bg-blue-600" : "bg-red-600"
                                }`}
                              >
                                {acc.email[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                <span>{acc.email}</span>
                                {acc.isDefault && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-[#15605A]">
                                    Principal
                                  </span>
                                )}
                              </div>
                              {acc.name && <div className="text-[10px] text-gray-400">{acc.name}</div>}
                            </div>
                          </div>
                        </td>

                        {/* User Owner */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-800">
                            {acc.user.name} {acc.user.lastName}
                          </div>
                          <div className="text-[10px] text-gray-400">{acc.user.email}</div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              acc.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                acc.status === "active" ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            ></span>
                            {acc.status === "active" ? "Activo y Sincronizado" : acc.status}
                          </span>
                        </td>

                        {/* Token Encryption */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Lock className="w-3.5 h-3.5 text-purple-600" />
                            <span className="font-mono text-[10px] font-semibold">AES-256-GCM ({acc.oauthToken?.keyId || "v1"})</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                          {new Date(acc.createdAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: USUARIOS & CAPACIDAD */}
        {activeTab === "users" && (
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#15605A]/20 focus:border-[#15605A]"
                />
              </div>
              <span className="text-xs font-semibold text-gray-500">
                Total: {filteredUsers.length} usuarios
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200 text-[10px]">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Rol en Jabvox</th>
                    <th className="py-3 px-4">Cuentas Conectadas</th>
                    <th className="py-3 px-4">Capacidad de Cuentas</th>
                    <th className="py-3 px-4">Fecha de Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center">
                            {u.name[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{u.name}</div>
                            <div className="text-[10px] text-gray-400">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold text-[10px] ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {u.role === "SUPER_ADMIN" && <ShieldCheck className="w-3 h-3 text-amber-600" />}
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                            {u.connectedAccountsCount} {u.connectedAccountsCount === 1 ? "cuenta" : "cuentas"}
                          </span>
                          {u.accounts.map((acc) => (
                            <span
                              key={acc.id}
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                acc.provider === "microsoft"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {acc.email}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {u.allowedAccounts}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICIOS & DISPONIBILIDAD */}
        {activeTab === "services" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.services.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {svc.provider}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {svc.status}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-gray-900 mb-1">{svc.name}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-4">{svc.description}</p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-100 text-[11px]">
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Capacidad / Cuota:</span>
                      <span className="font-semibold text-gray-800 text-right">{svc.quotaInfo}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Cifrado:</span>
                      <span className="font-semibold text-purple-700">{svc.encryption}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LÍMITES & CUOTAS OFICIALES */}
        {activeTab === "quotas" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs">
              <h3 className="font-black text-base text-gray-900 mb-2">
                ¿Cuántas cuentas se pueden vincular por usuario?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                En el nuevo modelo simplificado de Jabvox, <strong>no existen límites artificiales de cuentas ni cobros por buzón adicional</strong>. Cada persona que adquiere el plan de Jabvox puede vincular libremente todas sus cuentas de correo personales y de trabajo (Gmail, Google Workspace, Outlook, Hotmail, Office 365).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-900 mb-1">Cuentas por Usuario</div>
                  <div className="text-2xl font-black text-[#15605A]">Ilimitadas</div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Incluido 100% en la suscripción mensual de Jabvox.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
                  <div className="text-xs font-bold text-blue-900 mb-1">Proveedores Soportados</div>
                  <div className="text-2xl font-black text-blue-700">Google & Microsoft</div>
                  <p className="text-[11px] text-blue-700 mt-1">
                    OAuth 2.0 nativo con refresco automático de credenciales.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200">
                  <div className="text-xs font-bold text-purple-900 mb-1">Capacidad de Usuarios</div>
                  <div className="text-2xl font-black text-purple-700">50.000+</div>
                  <p className="text-[11px] text-purple-700 mt-1">
                    Arquitectura preparada para alta concurrencia.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs">
              <h3 className="font-black text-base text-gray-900 mb-3">
                Cuotas Técnicas Oficiales de las APIs (Monitoreo de Infraestructura)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2 font-bold text-xs text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    Google Gmail API (Límites Oficiales)
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li>• <strong>Cuota por proyecto:</strong> 15,000 unidades / día (base gratuita de Google Cloud).</li>
                    <li>• <strong>Límite por usuario:</strong> 250 unidades de cuota por segundo.</li>
                    <li>• <strong>Envíos por día:</strong> 2,000 mensajes diarios (Google Workspace) o 500 (cuentas @gmail.com personales).</li>
                    <li>• <strong>Optimización Jabvox:</strong> Caché local en PostgreSQL para lectura y sincronización diferencial (solo mensajes nuevos).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2 font-bold text-xs text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Microsoft Graph API (Límites Oficiales)
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li>• <strong>Límite por aplicación:</strong> 10,000 solicitudes por cada período de 10 minutos.</li>
                    <li>• <strong>Límite por buzón:</strong> 4 solicitudes concurrentes por buzón de Outlook.</li>
                    <li>• <strong>Manejo de Throttling (HTTP 429):</strong> Exponential Backoff implementado en la capa de transporte.</li>
                    <li>• <strong>Renovación de tokens:</strong> Tokens de acceso de 60-90 minutos renovados vía Refresh Token con cifrado AES-256.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
