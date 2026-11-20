"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Mail,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Sliders,
  Infinity,
  ChevronDown,
  ChevronUp,
  Save,
  Search,
  Lock,
} from "lucide-react";

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  tier: string;
  maxAccounts: number;
  isUnlimited: boolean;
  maxDailySends: number;
  contactEmail?: string;
  createdAt: string;
  owner?: { id: string; name: string; lastName: string; email: string } | null;
  totalMembers: number;
  connectedAccountsCount: number;
  connectedAccounts: { id: string; email: string; provider: string; status: string }[];
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [stats, setStats] = useState({ totalTenants: 0, totalAccounts: 0, totalUsers: 0 });
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  // Edit states per tenant
  const [editedTenants, setEditedTenants] = useState<{
    [id: string]: { tier: string; maxAccounts: number; status: string };
  }>({});

  // Modal new tenant
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newMaxAccounts, setNewMaxAccounts] = useState("10");
  const [newIsUnlimited, setNewIsUnlimited] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tenants");

      if (res.status === 401 || res.status === 403) {
        alert("Acceso denegado: solo el Super Administrador puede acceder a este panel.");
        router.push("/console");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTenants(data.tenants || []);

        // Inicializar estado editable
        const initialEdits: any = {};
        data.tenants.forEach((t: TenantItem) => {
          initialEdits[t.id] = {
            tier: t.tier,
            maxAccounts: t.maxAccounts,
            status: t.status,
          };
        });
        setEditedTenants(initialEdits);
      }
    } catch (err) {
      console.error("Error fetching admin tenants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleUpdateTenant = async (tenantId: string) => {
    const edit = editedTenants[tenantId];
    if (!edit) return;

    try {
      setSavingId(tenantId);
      setMessage(null);

      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: edit.tier,
          maxAccounts: edit.maxAccounts,
          status: edit.status,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        await fetchTenants();
      } else {
        setMessage({ type: "error", text: data.error || "Error al actualizar la empresa" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error de conexión al actualizar la empresa" });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setIsCreating(true);
      setMessage(null);

      const limit = newIsUnlimited ? -1 : parseInt(newMaxAccounts, 10);

      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          ownerEmail: newOwnerEmail.trim(),
          maxAccounts: limit,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setNewName("");
        setNewOwnerEmail("");
        setShowCreateModal(false);
        await fetchTenants();
      } else {
        setMessage({ type: "error", text: data.error || "Error al crear la empresa" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error de red al crear la empresa" });
    } finally {
      setIsCreating(false);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.contactEmail?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.owner?.email.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Super Admin Top Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide text-white">JABVOX</span>
            <span className="text-emerald-400 text-xs ml-2 font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800">
              SUPER ADMIN
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/console"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
          >
            <span>Vista Empresa / Cliente</span>
          </Link>
          <Link
            href="/mail"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#15605A] text-white hover:bg-[#114b46] transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Webmail</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Banner Title & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Gestión Central de Empresas y Asignación de Planes SaaS
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Como Super Administrador, aquí defines qué plan tiene cada empresa (ej: 10 cuentas de
              Google, 25 cuentas, o Ilimitadas).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTenants}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Crear Nueva Empresa</span>
            </button>
          </div>
        </div>

        {/* Global SaaS Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Empresas Registradas
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats.totalTenants}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cuentas de Correo Conectadas
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats.totalAccounts}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Usuarios SaaS
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {stats.totalUsers}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Buscar por nombre de empresa o correo de usuario..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-800 focus:outline-none"
          />
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Empresas y Asignación de Planes ({filteredTenants.length})
              </h2>
              <p className="text-xs text-slate-500">
                Cambia el plan o escribe el número exacto de cuentas permitidas para cada empresa.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Empresa / Propietario</th>
                  <th className="py-3.5 px-5">Plan Asignado</th>
                  <th className="py-3.5 px-5">Límite de Cuentas</th>
                  <th className="py-3.5 px-5">Cuentas en Uso</th>
                  <th className="py-3.5 px-5">Estado</th>
                  <th className="py-3.5 px-5 text-right">Guardar / Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTenants.map((t) => {
                  const edit = editedTenants[t.id] || {
                    tier: t.tier,
                    maxAccounts: t.maxAccounts,
                    status: t.status,
                  };
                  const isExpanded = expandedTenantId === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Dueño: {t.owner ? `${t.owner.name} (${t.owner.email})` : t.contactEmail || "Sin asignar"}
                        </div>
                      </td>

                      {/* Selector de Plan SaaS */}
                      <td className="py-4 px-5">
                        <select
                          value={edit.tier}
                          onChange={(e) => {
                            const selectedTier = e.target.value;
                            let newLimit = 10;
                            if (selectedTier === "ENTERPRISE") newLimit = -1;
                            else if (selectedTier === "BUSINESS_25") newLimit = 25;
                            else if (selectedTier === "PRO_10") newLimit = 10;
                            else if (selectedTier === "STARTER") newLimit = 2;

                            setEditedTenants((prev) => ({
                              ...prev,
                              [t.id]: {
                                ...prev[t.id],
                                tier: selectedTier,
                                maxAccounts: newLimit,
                              },
                            }));
                          }}
                          className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                        >
                          <option value="STARTER">Plan Starter (2 Cuentas)</option>
                          <option value="PRO_10">Plan Pyme (10 Cuentas)</option>
                          <option value="BUSINESS_25">Plan Business (25 Cuentas)</option>
                          <option value="ENTERPRISE">Plan Enterprise (Ilimitado ∞)</option>
                        </select>
                      </td>

                      {/* Ajuste Manual de Cuentas */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            disabled={edit.maxAccounts === -1}
                            value={edit.maxAccounts === -1 ? "" : edit.maxAccounts}
                            placeholder={edit.maxAccounts === -1 ? "Ilimitadas (∞)" : "10"}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setEditedTenants((prev) => ({
                                ...prev,
                                [t.id]: {
                                  ...prev[t.id],
                                  maxAccounts: isNaN(val) ? 10 : val,
                                },
                              }));
                            }}
                            className={`w-24 border rounded-xl px-2.5 py-1.5 text-xs font-bold text-center focus:outline-none ${
                              edit.maxAccounts === -1
                                ? "bg-slate-100 text-slate-400 border-slate-200"
                                : "border-slate-300 text-slate-900 focus:border-emerald-600"
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setEditedTenants((prev) => ({
                                ...prev,
                                [t.id]: {
                                  ...prev[t.id],
                                  maxAccounts: prev[t.id]?.maxAccounts === -1 ? 10 : -1,
                                  tier: prev[t.id]?.maxAccounts === -1 ? "PRO_10" : "ENTERPRISE",
                                },
                              }));
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              edit.maxAccounts === -1
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                            }`}
                            title="Alternar entre número fijo e Ilimitado"
                          >
                            {edit.maxAccounts === -1 ? "∞ Ilimitado" : "Fijar ∞"}
                          </button>
                        </div>
                      </td>

                      {/* Cuentas en uso en tiempo real */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {t.connectedAccountsCount}{" "}
                            <span className="text-slate-400 font-normal">
                              / {t.maxAccounts === -1 ? "∞" : t.maxAccounts}
                            </span>
                          </span>

                          <button
                            onClick={() => setExpandedTenantId(isExpanded ? null : t.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Ver buzones conectados"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Dropdown con los correos conectados */}
                        {isExpanded && (
                          <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase">
                              Bandejas de la empresa:
                            </div>
                            {t.connectedAccounts.length === 0 ? (
                              <div className="text-[11px] text-slate-400 italic">
                                Sin cuentas conectadas todavía
                              </div>
                            ) : (
                              t.connectedAccounts.map((acc) => (
                                <div
                                  key={acc.id}
                                  className="text-[11px] flex items-center gap-1.5 text-slate-700 font-medium"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>{acc.email}</span>
                                  <span className="text-[10px] text-slate-400 uppercase">
                                    ({acc.provider})
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-5">
                        <select
                          value={edit.status}
                          onChange={(e) => {
                            setEditedTenants((prev) => ({
                              ...prev,
                              [t.id]: {
                                ...prev[t.id],
                                status: e.target.value,
                              },
                            }));
                          }}
                          className={`rounded-lg px-2 py-1 text-[11px] font-bold border focus:outline-none ${
                            edit.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }`}
                        >
                          <option value="ACTIVE">ACTIVA</option>
                          <option value="SUSPENDED">SUSPENDIDA</option>
                        </select>
                      </td>

                      {/* Botón Guardar Cambios */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleUpdateTenant(t.id)}
                          disabled={savingId === t.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-2xs"
                        >
                          {savingId === t.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>Guardar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      No se encontraron empresas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Crear Nueva Empresa */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registrar Nueva Empresa (Tenant)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Crea una empresa y asígnale el número de cuentas de Google/Microsoft permitidas.
              </p>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Acme Corp S.A.S."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo del Usuario Dueño / Administrador
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@empresa.com"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  El usuario debe estar registrado en Jabvox para asociarlo como dueño.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capacidad de Cuentas Permitidas
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    disabled={newIsUnlimited}
                    value={newIsUnlimited ? "" : newMaxAccounts}
                    onChange={(e) => setNewMaxAccounts(e.target.value)}
                    placeholder={newIsUnlimited ? "Ilimitadas (∞)" : "ej: 10"}
                    className={`flex-1 border rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none ${
                      newIsUnlimited
                        ? "bg-slate-100 text-slate-400 border-slate-200"
                        : "border-slate-300 focus:border-emerald-600 text-slate-900"
                    }`}
                  />

                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newIsUnlimited}
                      onChange={(e) => setNewIsUnlimited(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Ilimitadas (∞)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {isCreating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Crear y Asignar Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
