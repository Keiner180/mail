"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token de recuperación no encontrado o inválido");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al restablecer la contraseña");
      }

      setMessage(data.message);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Enlace Inválido</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          No se encontró el token de recuperación en la dirección.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
        >
          Solicitar un nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          <span>{message} Redirigiendo a inicio de sesión...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Nueva Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Confirmar Nueva Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || Boolean(message)}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Actualizar Contraseña</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f6f8fc]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200/80 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Restablecer Contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ingresa tu nueva contraseña para acceder a tu cuenta
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-6">Cargando formulario...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
          ¿Recordaste tu contraseña?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
