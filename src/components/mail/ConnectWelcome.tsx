"use client";

import { Mail, ShieldCheck, Zap, Layers, ArrowRight, CheckCircle2, Lock } from "lucide-react";

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
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-[#DAEBDB]/20 to-[#A8D5D3]/20">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 p-8 md:p-10 shadow-xl text-center">
        {/* Top Icon with Jabvox Teal Glow */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#15605A] to-[#258f86] text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#15605A]/25">
          <Mail className="w-8 h-8" />
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          ¡Bienvenido a Jabvox Mail, {userName}!
        </h2>
        <p className="text-sm text-slate-500 mt-2.5 max-w-md mx-auto leading-relaxed">
          Gestiona tus correos de Gmail con total comodidad, privacidad y rapidez directamente desde tu panel de Jabvox.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-7 text-left">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#15605A]/30 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#15605A] flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">OAuth 2.0 Seguro</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Credenciales y tokens cifrados con AES-256-GCM y CSRF HMAC.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#15605A]/30 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-2.5">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Multi-cuenta</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Conecta varias cuentas de Gmail y conmuta entre ellas al instante.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#15605A]/30 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">API Oficial Google</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Búsqueda en tiempo real, redacción fluida y sin usar iframes.
            </p>
          </div>
        </div>

        {/* Quick Consent Tip */}
        <div className="p-3.5 mb-7 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-left flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Nota importante para la conexión:</span> En la pantalla de autorización de Google, recuerda marcar la casilla de permiso <em>&quot;Ver, editar, crear y eliminar correos electrónicos de Gmail&quot;</em> para que tus bandejas y correos se sincronicen de una vez.
          </div>
        </div>

        <button
          onClick={onConnect}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#15605A] to-[#1e7a72] hover:from-[#114b46] hover:to-[#17625b] text-white font-bold text-sm shadow-lg shadow-[#15605A]/25 hover:shadow-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Vincular cuenta de Gmail</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-4">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Conexión cifrada de punto a punto &bull; Redirección oficial Google</span>
        </div>
      </div>
    </div>
  );
}
