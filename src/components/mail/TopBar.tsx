"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  RotateCw,
  X,
  Menu,
  Mail,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  Check,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface Account {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  status: string;
  isDefault: boolean;
}

interface UserInfo {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

interface TopBarProps {
  user: UserInfo;
  accounts: Account[];
  activeAccount: Account | null;
  onSelectAccount: (account: Account) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  searchQuery: string;
  onSearch: (query: string) => void;
  onToggleSidebar?: () => void;
  onConnectGmail: () => void;
}

export default function TopBar({
  user,
  accounts,
  activeAccount,
  onSelectAccount,
  onRefresh,
  isRefreshing,
  searchQuery,
  onSearch,
  onToggleSidebar,
  onConnectGmail,
}: TopBarProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Keyboard shortcut Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    onSearch("");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 select-none shadow-2xs">
      {/* Left: Module title with Jabvox style badge */}
      <div className="flex items-center gap-2.5 min-w-[170px]">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 rounded-xl hover:bg-gray-100 text-gray-600 md:hidden transition-colors"
            title="Carpetas de correo"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="w-9 h-9 rounded-2xl bg-[#15605A]/10 text-[#15605A] flex items-center justify-center flex-shrink-0 shadow-2xs">
          <Mail className="w-4.5 h-4.5" />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-gray-900 text-sm tracking-tight block leading-tight">
              Correo
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gmail API
            </span>
          </div>
          <span className="text-[10px] text-gray-400 block font-medium">Bandeja oficial integrada</span>
        </div>
      </div>

      {/* Middle: Modern Omnisearch Bar */}
      <div className="flex-1 max-w-2xl">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center bg-[#f0f4f9] hover:bg-[#e9eef6] focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#15605A]/20 rounded-2xl transition-all duration-200 border border-transparent focus-within:border-[#8FC4C2]">
            <button
              type="submit"
              className="p-2.5 pl-3.5 text-gray-400 hover:text-[#15605A] transition-colors"
              title="Buscar en Gmail"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por remitente, asunto o palabras (ej: de:juan, tiene:adjunto)..."
              className="w-full bg-transparent py-2.5 pr-20 text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-none font-medium"
            />
            
            {/* Shortcut pill or Clear button */}
            <div className="absolute right-3 flex items-center gap-1">
              {searchInput ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/60"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-gray-400 bg-white/80 border border-gray-200 rounded-md shadow-2xs">
                  Ctrl K
                </kbd>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Right: Refresh, Account Switcher & Security Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-all active:scale-95 shadow-2xs"
          title="Sincronizar bandeja"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#15605A]" : ""}`} />
        </button>

        {/* Account Switcher Dropdown */}
        <div className="relative" ref={accountMenuRef}>
          {activeAccount ? (
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-2xl hover:bg-gray-100 border border-gray-200/80 bg-white shadow-2xs transition-all text-left group"
              title="Cuentas de Gmail vinculadas"
            >
              {activeAccount.avatar ? (
                <img
                  src={activeAccount.avatar}
                  alt={activeAccount.email}
                  className="w-7 h-7 rounded-full object-cover border border-emerald-300 ring-1 ring-emerald-500/20"
                />
              ) : (
                <div
                  style={{ backgroundColor: "#15605A" }}
                  className="w-7 h-7 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-2xs"
                >
                  {activeAccount.email[0].toUpperCase()}
                </div>
              )}
              <div className="hidden lg:block max-w-[130px] truncate text-xs">
                <span className="font-bold text-gray-800 block truncate leading-tight">
                  {activeAccount.name || activeAccount.email.split("@")[0]}
                </span>
                <span className="text-gray-400 block truncate text-[10px]">
                  {activeAccount.email}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-colors" />
            </button>
          ) : (
            <button
              onClick={onConnectGmail}
              style={{ backgroundColor: "#15605A" }}
              className="px-3.5 py-2 rounded-2xl hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Conectar Gmail</span>
            </button>
          )}

          {/* Account Dropdown Menu */}
          {showAccountMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-200 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-100 mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Cuentas de Gmail Vinculadas
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                  {accounts.length} {accounts.length === 1 ? "cuenta" : "cuentas"}
                </span>
              </div>

              <div className="space-y-1 my-1 max-h-56 overflow-y-auto">
                {accounts.map((acc) => {
                  const isCurrent = acc.id === activeAccount?.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => {
                        onSelectAccount(acc);
                        setShowAccountMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all ${
                        isCurrent
                          ? "bg-emerald-50/80 text-[#15605A] font-bold shadow-2xs"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {acc.avatar ? (
                        <img
                          src={acc.avatar}
                          alt={acc.email}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div
                          style={{ backgroundColor: "#15605A" }}
                          className="w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs"
                        >
                          {acc.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate block">
                            {acc.name || acc.email}
                          </span>
                          {acc.status === "revoked" && (
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 block truncate">{acc.email}</span>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#15605A] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowAccountMenu(false);
                    onConnectGmail();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-bold text-[#15605A] hover:bg-emerald-50/60 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Vincular otra cuenta de Gmail</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              background: "linear-gradient(135deg, #15605A 0%, #1d3a35 100%)",
            }}
            className="w-8 h-8 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-2xs hover:opacity-90 transition-opacity"
            title="Ajustes de usuario"
          >
            {user.name[0]?.toUpperCase()}
            {user.lastName[0]?.toUpperCase()}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-gray-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 bg-gray-50 rounded-2xl mb-2">
                <div className="font-bold text-xs text-gray-900">
                  {user.name} {user.lastName}
                </div>
                <div className="text-[11px] text-gray-500 truncate">{user.email}</div>
              </div>

              <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Configuración y Cuentas</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
