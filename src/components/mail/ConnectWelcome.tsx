"use client";

import { useState } from "react";
import {
  Mail,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface ConnectWelcomeProps {
  userName: string;
  onConnect: () => void;
  onConnectMicrosoft?: () => void;
  loading?: boolean;
}

export default function ConnectWelcome({
  userName,
  onConnect,
  onConnectMicrosoft,
  loading = false,
}: ConnectWelcomeProps) {
  const [connectingProvider, setConnectingProvider] = useState<"google" | "microsoft" | null>(null);

  const handleGoogle = () => {
    setConnectingProvider("google");
    onConnect();
  };

  const handleMicrosoft = async () => {
    setConnectingProvider("microsoft");
    if (onConnectMicrosoft) {
      onConnectMicrosoft();
      return;
    }

    try {
      const res = await fetch("/api/auth/microsoft/url");
      const data = await res.json();
      if (data.configured && data.url) {
        window.location.href = data.url;
      } else {
        alert(
          data.error ||
            "Para conectar cuentas de Outlook / Hotmail, debes registrar las credenciales de Microsoft OAuth (MICROSOFT_CLIENT_ID y MICROSOFT_CLIENT_SECRET) en tu archivo .env."
        );
        setConnectingProvider(null);
      }
    } catch {
      alert("Error al conectar con Microsoft OAuth");
      setConnectingProvider(null);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-[#DAEBDB]/20 to-[#A8D5D3]/20">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200/90 p-8 md:p-10 shadow-xl text-center">
        {/* Top Icon with Jabvox Teal Glow */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#15605A] to-[#258f86] text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#15605A]/25">
          <Mail className="w-8 h-8" />
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          ¡Bienvenido a Jabvox Mail, {userName}!
        </h2>
        <p className="text-sm text-slate-500 mt-2.5 max-w-lg mx-auto leading-relaxed">
          Gestiona tus cuentas de <strong>Gmail</strong> y <strong>Outlook / Hotmail</strong> junto con tu <strong>Google Calendar</strong> directamente desde tu panel de Jabvox.
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
            <h4 className="text-xs font-bold text-slate-900">Gmail & Outlook</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Conecta múltiples cuentas de Google y Microsoft en una sola bandeja.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#15605A]/30 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2.5">
              <Calendar className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Google Calendar</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Reuniones Google Meet, agenda interactiva y vistas por mes y día.
            </p>
          </div>
        </div>

        {/* Quick Consent Tip */}
        <div className="p-3.5 mb-7 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-left flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Para Gmail & Google Calendar:</span> En la pantalla de autorización de Google, recuerda marcar la casilla de permiso <em>&quot;Ver, editar, crear y eliminar correos electrónicos de Gmail&quot;</em> y los permisos de Calendar para que tus bandejas y eventos se sincronicen de una vez.
          </div>
        </div>

        {/* Action Buttons: Gmail & Outlook */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Connect Gmail */}
          <button
            onClick={handleGoogle}
            disabled={loading || connectingProvider !== null}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#15605A] to-[#1e7a72] hover:from-[#114b46] hover:to-[#17625b] text-white font-bold text-sm shadow-md shadow-[#15605A]/25 hover:shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
          >
            {connectingProvider === "google" && loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.053 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                <span>Vincular Gmail (Google)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Connect Outlook / Hotmail */}
          <button
            onClick={handleMicrosoft}
            disabled={loading || connectingProvider !== null}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[#0078d4] hover:bg-[#0060aa] text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
          >
            {connectingProvider === "microsoft" ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M11.55 0H0v11.55h11.55V0zm12.45 0H12.45v11.55H24V0zM11.55 12.45H0V24h11.55V12.45zm12.45 0H12.45V24H24V12.45z" />
                </svg>
                <span>Vincular Outlook / Hotmail</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-5">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Conexión cifrada de punto a punto &bull; OAuth 2.0 Oficial</span>
        </div>
      </div>
    </div>
  );
}
