"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Star,
} from "lucide-react";

interface AccountItem {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  provider: string;
  status: string;
  isDefault: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/auth/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setName(data.user.name);
      setLastName(data.user.lastName);
      setAccounts(data.accounts || []);
    } catch {
      setErrorMsg("Error al cargar los datos del perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("Las nuevas contraseñas no coinciden");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          lastName,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar perfil");
      }

      setUser(data.user);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMsg("Perfil actualizado correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
      const res = await fetch("/api/auth/google/url");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg(data.error || "No se pudo iniciar conexión con Google");
      }
    } catch {
      setErrorMsg("Error de red al conectar con Google");
    }
  };

  const handleConnectMicrosoft = async () => {
    try {
      const res = await fetch("/api/auth/microsoft/url");
      const data = await res.json();
      if (data.configured && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg(
          data.error ||
            "Para conectar Outlook / Hotmail, configura MICROSOFT_CLIENT_ID y MICROSOFT_CLIENT_SECRET en .env."
        );
      }
    } catch {
      setErrorMsg("Error de red al conectar con Microsoft OAuth");
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/default`, {
        method: "POST",
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((acc) => ({
            ...acc,
            isDefault: acc.id === accountId,
          }))
        );
        setSuccessMsg("Cuenta predeterminada actualizada");
      }
    } catch {
      setErrorMsg("Error al cambiar cuenta predeterminada");
    }
  };

  const handleDeleteAccount = async (accountId: string, email: string) => {
    if (!confirm(`¿Estás seguro de desvincular la cuenta ${email}?`)) return;

    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
        setSuccessMsg(`Cuenta ${email} desvinculada exitosamente`);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Error al desvincular cuenta");
      }
    } catch {
      setErrorMsg("Error al comunicarse con el servidor");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8fc]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/mail"
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Volver a la bandeja"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Configuración de Usuario</h1>
          </div>

          <Link
            href="/mail"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Ir a Bandeja de Entrada
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Personal Details & Password Section */}
        <section className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center">
              {user?.name?.[0]?.toUpperCase()}
              {user?.lastName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {user?.name} {user?.lastName}
              </h2>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Cambiar Contraseña</h3>
              <p className="text-xs text-gray-500 mb-4">
                Deja estos campos en blanco si no deseas cambiar tu contraseña.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Guardar Cambios
              </button>
            </div>
          </form>
        </section>

        {/* Connected Accounts Section */}
        <section className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 mb-6 gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Cuentas de Correo Vinculadas</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Conecta tus cuentas oficiales de Gmail y Outlook / Hotmail para gestionarlas directamente
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConnectGmail}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#15605A] text-xs font-bold transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Gmail</span>
              </button>

              <button
                onClick={handleConnectMicrosoft}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0078d4] text-xs font-bold transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Outlook</span>
              </button>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
              <Mail className="w-10 h-10 text-gray-400 mx-auto mb-2.5" />
              <h3 className="text-sm font-semibold text-gray-800">No hay cuentas de correo vinculadas</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-4">
                Vincula tu primera cuenta de Gmail o Outlook mediante OAuth 2.0 para empezar a recibir y enviar correos.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleConnectGmail}
                  className="px-4 py-2 rounded-xl bg-[#15605A] hover:bg-[#114b46] text-white font-bold text-xs shadow-sm transition-all"
                >
                  Vincular Gmail
                </button>
                <button
                  onClick={handleConnectMicrosoft}
                  className="px-4 py-2 rounded-xl bg-[#0078d4] hover:bg-[#0060aa] text-white font-bold text-xs shadow-sm transition-all"
                >
                  Vincular Outlook
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {accounts.map((acc) => {
                const isMs = acc.provider === "microsoft" || acc.provider === "outlook";

                return (
                  <div key={acc.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {acc.avatar ? (
                        <img
                          src={acc.avatar}
                          alt={acc.email}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-xl font-bold text-xs text-white flex items-center justify-center flex-shrink-0 shadow-2xs ${
                            isMs ? "bg-[#0078d4]" : "bg-[#15605A]"
                          }`}
                        >
                          {isMs ? "MS" : acc.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 truncate">
                            {acc.name || acc.email}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isMs
                                ? "bg-blue-100 text-[#0078d4]"
                                : "bg-emerald-100 text-[#15605A]"
                            }`}
                          >
                            {isMs ? "Outlook" : "Gmail"}
                          </span>
                          {acc.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[10px]">
                              Predeterminada
                            </span>
                          )}
                          {acc.status === "active" ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium text-[10px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Activa
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium text-[10px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Requiere reconexión
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{acc.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!acc.isDefault && (
                        <button
                          onClick={() => handleSetDefault(acc.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                          title="Marcar como cuenta principal"
                        >
                          Hacer principal
                        </button>
                      )}

                      {acc.status !== "active" && (
                        <button
                          onClick={isMs ? handleConnectMicrosoft : handleConnectGmail}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
                        >
                          Reconectar
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteAccount(acc.id, acc.email)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Desvincular cuenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

