"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Mail,
  Calendar,
  Lock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Building,
  Plus,
  RefreshCw,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Infinity,
} from "lucide-react";

interface PlanInfo {
  id: string;
  name: string;
  maxAccounts: number;
  maxDailySends: number;
  storageGB: number;
  description: string;
  isPopular?: boolean;
}

export default function SaaSConsolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // SaaS Plan State
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanInfo[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("USER");

  // Custom Quota input state
  const [customAccounts, setCustomAccounts] = useState<string>("10");
  const [isUnlimitedChecked, setIsUnlimitedChecked] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, statusRes] = await Promise.all([
        fetch("/api/plans"),
        fetch("/api/provisioning/status"),
      ]);

      if (plansRes.status === 401 || statusRes.status === 401) {
        router.push("/auth/login");
        return;
      }

      if (plansRes.ok) {
        const data = await plansRes.json();
        setCurrentPlan(data.currentPlan);
        setAvailablePlans(data.availablePlans || []);
        setTenant(data.tenant);
        setUserRole(data.userRole || "USER");
        if (data.currentPlan.isUnlimited) {
          setIsUnlimitedChecked(true);
          setCustomAccounts("-1");
        } else {
          setIsUnlimitedChecked(false);
          setCustomAccounts(String(data.currentPlan.maxAccounts));
        }
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setAccounts(statusData.accounts || []);
      }
    } catch (err) {
      console.error("Error fetching SaaS console data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    try {
      setUpdatingPlan(true);
      setMessage(null);

      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Error al actualizar el plan" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error de red al actualizar el plan" });
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleSaveCustomQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingPlan(true);
      setMessage(null);

      const limit = isUnlimitedChecked ? -1 : parseInt(customAccounts, 10);

      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customAccountsLimit: limit }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.error || "Error al guardar el límite" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error de conexión al guardar el límite" });
    } finally {
      setUpdatingPlan(false);
    }
  };

  const isLimitReached =
    currentPlan &&
    !currentPlan.isUnlimited &&
    currentPlan.connectedCount >= currentPlan.maxAccounts;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* SaaS Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Building className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">JABVOX</span>
              <span className="text-slate-400 text-xs ml-1.5 font-medium">
                Planes & Capacidad SaaS
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          {/* Company Workspace badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300">
            <span className="text-slate-400">Empresa:</span>
            <span className="font-semibold text-emerald-400">
              {tenant?.name || "Espacio de Trabajo Principal"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(userRole === "SUPER_ADMIN" || userRole === "PLATFORM_ADMIN") && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 transition-all shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Panel Super Admin</span>
            </Link>
          )}

          <Link
            href="/mail"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#15605A] text-white hover:bg-[#114b46] transition-all shadow-xs"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Ir al Webmail</span>
          </Link>
          <Link
            href="/calendar"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all border border-slate-700"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* Super Admin Notice Banner */}
        {(userRole === "SUPER_ADMIN" || userRole === "PLATFORM_ADMIN") && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  Modo Super Administrador Activo
                </div>
                <div className="text-xs text-slate-300">
                  Puedes crear empresas, cambiar planes y asignar límites personalizados desde el panel central.
                </div>
              </div>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Gestionar Empresas & Planes &rarr;</span>
            </Link>
          </div>
        )}
        {/* Alerts */}
        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 shadow-xs ${
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

        {/* Current Plan & Capacity Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Plan Activo de la Empresa
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {currentPlan?.isUnlimited
                  ? "ENTERPRISE (CUENTAS ILIMITADAS)"
                  : `PLAN ${currentPlan?.maxAccounts} CUENTAS`}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                {currentPlan?.isUnlimited
                  ? "Cuentas de Correo Ilimitadas"
                  : `Capacidad para hasta ${currentPlan?.maxAccounts} Cuentas`}
              </h1>
            </div>

            <p className="text-xs text-slate-500 max-w-xl">
              Cada cuenta de Google o Microsoft conectada opera de forma 100% independiente
              con sus propios tokens cifrados con AES-256-GCM.
            </p>
          </div>

          {/* Quick Connect Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href={isLimitReached ? "#" : "/api/auth/google/url"}
              onClick={(e) => {
                if (isLimitReached) {
                  e.preventDefault();
                  alert(
                    `Has alcanzado el límite de ${currentPlan?.maxAccounts} cuentas de tu plan. Aumenta tu cuota o cambia al plan Enterprise para conectar más cuentas.`
                  );
                }
              }}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-md ${
                isLimitReached
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-[#15605A] to-[#1e7a72] text-white hover:scale-[1.02] shadow-[#15605A]/25"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Conectar Cuenta de Google</span>
            </a>

            <a
              href={isLimitReached ? "#" : "/api/auth/microsoft/url"}
              onClick={(e) => {
                if (isLimitReached) {
                  e.preventDefault();
                  alert(
                    `Has alcanzado el límite de ${currentPlan?.maxAccounts} cuentas de tu plan. Aumenta tu cuota o cambia al plan Enterprise para conectar más cuentas.`
                  );
                }
              }}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all border ${
                isLimitReached
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-2xs"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Conectar Cuenta Microsoft</span>
            </a>
          </div>
        </div>

        {/* Real-time Usage Progress Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Uso de Cuentas Conectadas en la Empresa
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {currentPlan?.isUnlimited ? (
                <span className="flex items-center gap-1 text-emerald-700">
                  <span>{currentPlan?.connectedCount} conectadas</span>
                  <span>&bull;</span>
                  <Infinity className="w-4 h-4" />
                  <span>Ilimitadas</span>
                </span>
              ) : (
                <span>
                  {currentPlan?.connectedCount} de {currentPlan?.maxAccounts} cuentas en uso
                </span>
              )}
            </span>
          </div>

          {!currentPlan?.isUnlimited && (
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isLimitReached ? "bg-amber-500" : "bg-emerald-600"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    ((currentPlan?.connectedCount ?? 0) / (currentPlan?.maxAccounts ?? 1)) * 100
                  )}%`,
                }}
              />
            </div>
          )}

          {isLimitReached && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>
                Esta empresa ha alcanzado su límite de {currentPlan?.maxAccounts} cuentas.
                Puedes aumentar el límite abajo para permitir 15, 20 o cuentas ilimitadas.
              </span>
            </div>
          )}
        </div>

        {/* Plan Selector Grid */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Planes Disponibles para tu SaaS</h2>
            <p className="text-xs text-slate-500">
              Elige un plan preconfigurado para asignar inmediatamente el número de cuentas
              permitidas para esta empresa:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availablePlans.map((plan) => {
              const isCurrent =
                (plan.maxAccounts === -1 && currentPlan?.isUnlimited) ||
                (plan.maxAccounts === currentPlan?.maxAccounts && !currentPlan?.isUnlimited);

              return (
                <div
                  key={plan.id}
                  className={`p-5 rounded-3xl border-2 flex flex-col justify-between transition-all ${
                    isCurrent
                      ? "border-emerald-600 bg-emerald-50/30 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{plan.name}</span>
                      {plan.isPopular && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          POPULAR
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1">
                      {plan.maxAccounts === -1 ? (
                        <div className="flex items-center gap-1.5 text-2xl font-black text-slate-900">
                          <Infinity className="w-7 h-7 text-emerald-700" />
                          <span>Ilimitadas</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-black text-slate-900">
                          {plan.maxAccounts}{" "}
                          <span className="text-xs font-normal text-slate-500">cuentas</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">{plan.description}</p>

                    <ul className="text-xs space-y-1.5 text-slate-600 pt-2 border-t border-slate-100">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {plan.maxAccounts === -1
                            ? "Cuentas de Google/MS ilimitadas"
                            : `Hasta ${plan.maxAccounts} cuentas de Google/MS`}
                        </span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {plan.maxDailySends === -1
                            ? "Envíos diarios ilimitados"
                            : `${plan.maxDailySends} envíos / día`}
                        </span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{plan.storageGB} GB Almacenamiento</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-5">
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrent || updatingPlan}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-emerald-700 text-white cursor-default"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      {isCurrent ? "Plan Actual" : "Asignar este Plan"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Quota Adjustment Tool (Para que digas exactamente cuántas cuentas puede tener) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4.5 h-4.5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Ajuste Manual de Cuentas para esta Empresa
              </h2>
              <p className="text-xs text-slate-500">
                Puedes definir manualmente el número exacto de cuentas que esta empresa puede
                conectar (ej: 10 cuentas, 20 cuentas, o ilimitadas):
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveCustomQuota} className="flex flex-col sm:flex-row items-end gap-4 pt-2">
            <div className="w-full sm:w-64">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número Máximo de Cuentas Permitidas
              </label>
              <input
                type="number"
                min="1"
                disabled={isUnlimitedChecked}
                value={isUnlimitedChecked ? "" : customAccounts}
                onChange={(e) => setCustomAccounts(e.target.value)}
                placeholder={isUnlimitedChecked ? "Ilimitadas (∞)" : "ej: 10"}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none ${
                  isUnlimitedChecked
                    ? "bg-slate-100 text-slate-400 border-slate-200"
                    : "border-slate-300 focus:border-emerald-600 text-slate-900"
                }`}
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pb-3 select-none">
              <input
                type="checkbox"
                checked={isUnlimitedChecked}
                onChange={(e) => setIsUnlimitedChecked(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Marcar como Cuentas Ilimitadas (∞)</span>
            </label>

            <button
              type="submit"
              disabled={updatingPlan}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {updatingPlan ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Guardar Límite para esta Empresa</span>
            </button>
          </form>
        </div>

        {/* Connected Accounts List */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Bandejas Conectadas de la Empresa ({accounts.length})
              </h2>
              <p className="text-xs text-slate-500">
                Cuentas de Google y Microsoft activas que consumen la cuota de la empresa.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Correo de la Cuenta</th>
                  <th className="py-3.5 px-6">Proveedor</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6">Seguridad</th>
                  <th className="py-3.5 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs">
                        {acc.email[0]?.toUpperCase()}
                      </div>
                      <span>{acc.email}</span>
                      {acc.isDefault && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Principal
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="capitalize px-2.5 py-1 rounded-lg font-medium text-[11px] bg-slate-100 text-slate-700">
                        {acc.provider}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          acc.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {acc.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tokens AES-256 Independientes</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href="/mail"
                        className="font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        Abrir en Webmail &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}

                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No hay cuentas de correo conectadas en esta empresa todavía. Haz clic en
                      &quot;Conectar Cuenta de Google&quot; arriba para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
