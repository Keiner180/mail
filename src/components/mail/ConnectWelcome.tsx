"use client";

import { Mail, ShieldCheck, Zap, Layers, ArrowRight } from "lucide-react";

interface ConnectWelcomeProps {
  userName: string;
  onConnect: () => void;
  loading?: boolean;
}

export default function ConnectWelcome({
  userName,
  onConnect,
  loading = false,
}: ConnectWelcomeProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#f6f8fc]">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-200/80 p-8 md:p-10 shadow-sm text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Mail className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          ¡Bienvenido a Jabvox Mail, {userName}!
        </h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          Gestiona tus correos de Gmail con total comodidad, privacidad y rapidez directamente desde tu panel.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-8 text-left">
          <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900">OAuth 2.0 Seguro</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Tus credenciales y tokens se almacenan cifrados con AES-256.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900">Multi-cuenta</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Conecta y administra múltiples cuentas de Gmail sin salir del panel.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-gray-900">API Oficial</h4>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Búsquedas en tiempo real, redacción fluida y sincronización continua.
            </p>
          </div>
        </div>

        <button
          onClick={onConnect}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-98 disabled:opacity-60"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Vincular Cuenta de Gmail</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-gray-400 mt-4">
          Serás redirigido a la pantalla oficial de autorización de Google.
        </p>
      </div>
    </div>
  );
}

