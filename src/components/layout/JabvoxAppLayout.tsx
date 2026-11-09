"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  LayoutGrid,
  Bot,
  Mail,
  Calendar,
  LineChart,
  BarChart3,
  PhoneCall,
  Settings,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Wallet,
  Sparkles,
  Moon,
  Bell,
  LogOut,
  Check,
  Building2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

interface JabvoxAppLayoutProps {
  children: React.ReactNode;
  user?: UserInfo | null;
}

export default function JabvoxAppLayout({
  children,
  user,
}: JabvoxAppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<"es" | "en">("es");
  const [currentStatus, setCurrentStatus] = useState<"Activo" | "Ocupado" | "Ausente">("Activo");

  const accountRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const displayName = user
    ? `${user.name} ${user.lastName}`.trim() || user.name
    : "Keiner Jaramillo";
  const displayEmail = user?.email || "keinerfelipejaramillodiaz@gmail.com";
  const userInitial = (user?.name?.[0] || "K").toUpperCase();

  const navLinks = [
    {
      id: "inicio",
      title: "Inicio",
      href: "/mail",
      icon: LayoutDashboard,
      active: pathname === "/" || pathname === "/dashboard",
    },
    {
      id: "conversaciones",
      title: "Conversaciones",
      href: "/mail",
      icon: MessageCircle,
      active: pathname.startsWith("/mail") && !pathname.includes("calendar"),
    },
    {
      id: "gestion",
      title: "Gestión",
      href: "/users",
      icon: LayoutGrid,
      active: pathname.startsWith("/users") || pathname.startsWith("/roles"),
    },
    {
      id: "ia",
      title: "Jabvox IA",
      href: "/ia",
      icon: Bot,
      active: pathname.startsWith("/ia"),
    },
    {
      id: "correo",
      title: "Correo",
      href: "/mail",
      icon: Mail,
      badge: "Gmail / Outlook",
      active: pathname.startsWith("/mail"),
    },
    {
      id: "calendario",
      title: "Calendario",
      href: "/calendar",
      icon: Calendar,
      badge: "Google Meet",
      active: pathname.startsWith("/calendar"),
    },
    {
      id: "reportes",
      title: "Reportes",
      href: "#reportes",
      icon: LineChart,
      isAction: true,
      onClick: () => setReportsModalOpen(true),
      active: false,
    },
    {
      id: "analytics",
      title: "Analytics BI",
      href: "#analytics",
      icon: BarChart3,
      isAction: true,
      onClick: () => setReportsModalOpen(true),
      active: false,
    },
    {
      id: "llamadas",
      title: "Llamadas",
      href: "#llamadas",
      icon: PhoneCall,
      isAction: true,
      onClick: () => alert("Módulo Jabvox Dialer activo para la cuenta."),
      active: false,
    },
    {
      id: "ajustes",
      title: "Ajustes",
      href: "/profile",
      icon: Settings,
      active: pathname.startsWith("/profile"),
    },
  ];

  return (
    <div
      className="flex flex-col w-full h-screen min-h-0 bg-[#EAF0F1] p-1.5 sm:p-2.5 md:p-3 overflow-hidden select-none font-sans text-slate-700 antialiased"
      dir="ltr"
    >
      {/* Outer rounded card container */}
      <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-xl md:rounded-2xl bg-white shadow-[0_12px_36px_rgba(30,64,74,0.12)] border border-[#8FC4C2]/40">
        {/* ========================================================= */}
        {/* TOP GLOBAL HEADER (Jabvox Official Structure) */}
        {/* ========================================================= */}
        <header className="absolute inset-x-0 top-0 z-[60] flex h-16 border-b border-[#8FC4C2] bg-white/95 shadow-xs backdrop-blur">
          {/* Left brand area: 232px width gradient banner */}
          <div
            style={{
              background: "linear-gradient(90deg, #DAEBDB 0%, #BDE1DE 60%, #A8D5D3 100%)",
            }}
            className={`flex h-full flex-shrink-0 items-center gap-2 overflow-hidden px-3 border-r border-[#8FC4C2] transition-all duration-300 ${
              isCollapsed ? "w-[72px] justify-center px-1" : "w-[232px]"
            }`}
          >
            {/* Logo Thumbnail */}
            <Link href="/mail" className="flex items-center gap-2 flex-shrink-0 group">
              <div
                style={{
                  background: "linear-gradient(135deg, #15605A 0%, #0d423e 100%)",
                }}
                className="w-9 h-9 rounded-xl text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-white/60 group-hover:scale-105 transition-transform"
              >
                J
              </div>
              {!isCollapsed && (
                <span
                  style={{ color: "#15605A" }}
                  className="font-extrabold text-base tracking-tight"
                >
                  Jabvox
                </span>
              )}
            </Link>

            {!isCollapsed && (
              <>
                <div className="h-6 w-px flex-shrink-0 bg-[#5B9690]/50 mx-1"></div>

                {/* Account Switcher Button */}
                <div className="relative min-w-0 flex-1" ref={accountRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-1.5 justify-between w-full rounded-lg px-2 py-1.5 hover:bg-white/50 cursor-pointer transition-colors text-left"
                    title="Espacio de trabajo"
                  >
                    <span className="text-xs font-semibold text-[#15605A] truncate">
                      Tecnologias Lan
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#2d5a52] flex-shrink-0" />
                  </button>

                  {/* Account Switcher Dropdown */}
                  {accountMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Espacios de Trabajo
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between bg-emerald-50/70 border-y border-emerald-100 text-[#15605A]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="w-4 h-4 text-[#15605A] flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold block truncate">Tecnologias Lan</span>
                            <span className="text-[10px] text-emerald-700 block">ID: 2 • Plan Enterprise</span>
                          </div>
                        </div>
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      </div>
                      <div className="px-3 py-2 text-gray-500 hover:bg-gray-50 cursor-pointer flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>Espacio Secundario (Demo)</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Header Content */}
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4">
            {/* Collapse toggle (Desktop) */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:grid size-9 flex-shrink-0 place-items-center rounded-lg text-[#2d5a52] transition-colors hover:bg-black/5"
              aria-label="Contraer menú lateral"
              title={isCollapsed ? "Expandir menú" : "Contraer menú"}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Collapse toggle (Mobile) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden grid size-9 flex-shrink-0 place-items-center rounded-lg text-[#2d5a52] transition-colors hover:bg-black/5"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Top Toolbar Action Badges */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {/* Wallet COP Balance */}
              <div className="hidden items-center gap-2 rounded-xl border border-gray-200/90 bg-white px-3 py-1.5 shadow-2xs lg:flex">
                <Wallet className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Saldo</span>
                <span className="text-xs font-bold text-emerald-600">$102.700 COP</span>
              </div>

              {/* AI USD Balance */}
              <div className="hidden items-center gap-2 rounded-xl border border-gray-200/90 bg-white px-3 py-1.5 shadow-2xs xl:flex">
                <Sparkles className="w-4 h-4 flex-shrink-0 text-teal-600" />
                <span className="text-xs text-gray-500 font-medium">Saldo IA</span>
                <span className="text-xs font-bold text-[#15605A]">$17.93 USD</span>
              </div>

              {/* User Status Dropdown */}
              <div className="relative" ref={statusRef}>
                <button
                  type="button"
                  onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                  className="flex max-w-48 items-center gap-2 rounded-xl border border-gray-200/90 bg-white px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 shadow-2xs cursor-pointer font-medium"
                  title="Estado de agente"
                >
                  <span
                    className={`size-2.5 flex-shrink-0 rounded-full ${
                      currentStatus === "Activo"
                        ? "bg-green-500 animate-pulse"
                        : currentStatus === "Ocupado"
                        ? "bg-amber-500"
                        : "bg-gray-400"
                    }`}
                  />
                  <span className="hidden truncate text-gray-700 lg:block">
                    {currentStatus}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                </button>

                {statusMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        setCurrentStatus("Activo");
                        setStatusMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="size-2 rounded-full bg-green-500" />
                      <span>Activo</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStatus("Ocupado");
                        setStatusMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span>Ocupado</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStatus("Ausente");
                        setStatusMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="size-2 rounded-full bg-gray-400" />
                      <span>Ausente</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Language Switcher Buttons (ES / EN) */}
              <div className="flex items-center gap-0.5 bg-gray-100/90 p-0.5 rounded-xl border border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setCurrentLang("es")}
                  className={`grid size-7 sm:size-8 place-items-center rounded-lg text-xs font-bold transition-all ${
                    currentLang === "es"
                      ? "bg-white text-[#15605A] shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  aria-label="Español"
                  title="Español"
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentLang("en")}
                  className={`grid size-7 sm:size-8 place-items-center rounded-lg text-xs font-bold transition-all ${
                    currentLang === "en"
                      ? "bg-white text-[#15605A] shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  aria-label="English"
                  title="English"
                >
                  EN
                </button>
              </div>

              {/* Dark mode button */}
              <button
                type="button"
                className="grid size-8 sm:size-9 place-items-center rounded-xl border border-gray-200/90 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-2xs"
                aria-label="Modo Oscuro"
                title="Modo Oscuro"
              >
                <Moon className="w-4 h-4" />
              </button>

              {/* Notification Bell with Badge "6" */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                  className="grid size-8 sm:size-9 place-items-center rounded-xl border border-gray-200/90 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-2xs relative"
                  aria-label="Notificaciones"
                  title="Notificaciones"
                >
                  <Bell className="w-4 h-4" />
                  <span className="min-h-2 min-w-2 p-0.5 px-1 bg-rose-500 rounded-full absolute -top-1 -right-1 grid place-items-center text-[9px] font-bold leading-none text-white ring-2 ring-white">
                    6
                  </span>
                </button>

                {notifMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                      <span className="font-bold text-gray-800">Notificaciones</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold">
                        6 nuevas
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-slate-700">
                        <span className="font-semibold block text-emerald-900 text-[11px]">
                          Gmail API conectada
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          Tu bandeja de entrada está sincronizada exitosamente.
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-slate-700">
                        <span className="font-semibold block text-blue-900 text-[11px]">
                          Google Calendar listo
                        </span>
                        <span className="text-[10px] text-blue-700">
                          Soporte para reuniones Google Meet activado.
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-slate-600">
                        <span className="font-semibold block text-gray-800 text-[11px]">
                          Seguridad AES-256 activa
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Protección CSRF y tokens encriptados.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Direct Access */}
              <Link
                href="/profile"
                className="relative flex items-center justify-center rounded-xl overflow-hidden ring-1 ring-gray-200 hover:ring-[#15605A] transition-all ml-0.5"
                title="Mi perfil y ajustes"
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #15605A 0%, #0d423e 100%)",
                  }}
                  className="w-8 h-8 text-white flex items-center justify-center text-xs font-bold"
                >
                  {userInitial}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile Backdrop Drawer */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-50 md:hidden backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ========================================================= */}
        {/* SIDEBAR NAVIGATION (Jabvox Official Gradient Sidebar) */}
        {/* ========================================================= */}
        <aside
          style={{
            background: "linear-gradient(180deg, #DAEBDB 0%, #BFE0DE 50%, #A8D5D3 100%)",
          }}
          className={`flex flex-col text-sm border-r border-[#8FC4C2] z-40 transition-all duration-300 md:mt-16 md:h-[calc(100%-4rem)] md:flex-shrink-0 select-none ${
            isCollapsed ? "w-[72px]" : "w-[232px]"
          } ${
            mobileMenuOpen
              ? "fixed inset-y-0 left-0 w-[240px] translate-x-0 shadow-2xl z-[70] md:relative md:shadow-none"
              : "hidden md:flex"
          }`}
        >
          {/* Mobile close button */}
          <div className="md:hidden flex items-center justify-between p-3 border-b border-[#8FC4C2]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#15605A] text-white flex items-center justify-center font-bold text-xs">
                J
              </div>
              <span className="font-bold text-[#15605A]">Jabvox</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg hover:bg-white/50 text-[#2d5a52]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links and Omnisearch */}
          <nav className="flex flex-col overflow-y-auto flex-grow gap-2 p-2 pb-5 min-w-0">
            {/* Search Pill */}
            {!isCollapsed ? (
              <Link
                href="/mail"
                className="flex gap-2 items-center px-2.5 h-8 rounded-lg bg-white/70 border border-[#8FC4C2]/80 transition-colors hover:bg-white text-xs shadow-2xs mb-1"
                title="Búsqueda rápida (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span className="flex-grow text-start truncate text-gray-600">Buscar...</span>
                <span className="flex-shrink-0 tracking-wide text-[10px] font-bold text-gray-400 bg-gray-100 px-1 rounded">
                  CTRL K
                </span>
              </Link>
            ) : (
              <div className="flex justify-center mb-1">
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-white/70 border border-[#8FC4C2]/80 flex items-center justify-center text-gray-600 hover:bg-white"
                  title="Buscar"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Nav list */}
            <ul className="flex flex-col gap-1 m-0 list-none min-w-0">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isSelected = item.active;

                if (item.isAction) {
                  return (
                    <li key={item.id} className="grid gap-1 text-sm cursor-pointer select-none min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          item.onClick?.();
                        }}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg h-9 min-w-0 text-[#2d5a52] hover:bg-white/50 transition-colors text-left w-full ${
                          isCollapsed ? "justify-center px-0" : ""
                        }`}
                        title={item.title}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0 text-[#2d5a52]" />
                        {!isCollapsed && (
                          <span className="truncate text-xs font-medium text-[#2d5a52]">
                            {item.title}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={item.id} className="grid gap-1 text-sm cursor-pointer select-none min-w-0">
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg h-9 min-w-0 transition-all ${
                        isSelected
                          ? "text-[#15605A] bg-white/80 font-bold shadow-xs border border-white/60"
                          : "text-[#2d5a52] hover:bg-white/40 hover:text-[#15605A]"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                      title={item.title}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isSelected ? "text-[#15605A]" : "text-[#2d5a52]"
                        }`}
                      />
                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate text-xs">{item.title}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-md bg-white/80 text-[9px] font-bold text-[#15605A] border border-[#8FC4C2]/50 truncate">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ========================================================= */}
          {/* USER PROFILE SECTION (Jabvox Official Structure) */}
          {/* ========================================================= */}
          <div className="p-2 border-t border-[#8FC4C2]/70 bg-white/30 backdrop-blur-xs">
            <div
              className={`flex items-center gap-2 ${
                isCollapsed ? "justify-center" : "justify-between"
              }`}
            >
              <Link
                href="/profile"
                className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-90 transition-opacity"
                title="Ajustes de perfil"
              >
                {/* Avatar with active indicator badge */}
                <div className="relative flex-shrink-0">
                  <div
                    style={{
                      background: "linear-gradient(135deg, #15605A 0%, #0d423e 100%)",
                    }}
                    className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center ring-1 ring-white/80 shadow-xs"
                  >
                    {userInitial}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></div>
                </div>

                {!isCollapsed && (
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight truncate text-slate-800">
                      {displayName}
                    </div>
                    <div className="text-[10px] truncate text-slate-600">
                      {displayEmail}
                    </div>
                  </div>
                )}
              </Link>

              {!isCollapsed && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-[#2d5a52] hover:text-rose-700 hover:bg-white/60 transition-colors flex-shrink-0"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN MODULE CONTENT AREA */}
        {/* ========================================================= */}
        <main className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-white md:mt-16 md:h-[calc(100%-4rem)] flex-col">
          {children}
        </main>
      </div>

      {/* Reports / Analytics BI Quick Modal */}
      {reportsModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#15605A]/10 text-[#15605A] flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Reportes & Métricas BI</h3>
              </div>
              <button
                onClick={() => setReportsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-gray-600">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-800 font-bold block text-lg">99.9%</span>
                  <span className="text-emerald-700">Tasa de entrega de correos</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-blue-800 font-bold block text-lg">AES-256</span>
                  <span className="text-blue-700">Seguridad GCM activa</span>
                </div>
              </div>
              <p className="text-gray-500">
                El sistema de métricas sincroniza en tiempo real los envíos por Gmail API,
                Microsoft Graph y eventos agendados en Google Calendar.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setReportsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#15605A] text-white font-bold text-xs hover:bg-[#0f4641] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
