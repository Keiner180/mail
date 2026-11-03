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
  ShieldAlert,
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

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

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
    <header className="h-16 bg-[#f6f8fc] border-b border-gray-200/80 px-4 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-3 min-w-[220px]">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-full hover:bg-gray-200/70 text-gray-600 md:hidden"
            title="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link href="/mail" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Jabvox</span>
            <span className="text-blue-600 font-semibold text-lg ml-1">Mail</span>
          </div>
        </Link>
      </div>

      {/* Middle: Gmail-style Search Bar */}
      <div className="flex-1 max-w-2xl">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center bg-[#eaf1fb] hover:bg-[#e2eaf5] focus-within:bg-white focus-within:shadow-md focus-within:ring-1 focus-within:ring-gray-300 rounded-full transition-all duration-200">
            <button
              type="submit"
              className="p-3 pl-4 text-gray-500 hover:text-gray-700"
              title="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar en el correo (ej. de:juan, asunto:factura)..."
              className="w-full bg-transparent py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-2 mr-2 text-gray-400 hover:text-gray-600 rounded-full"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right: Refresh, Account Switcher & User Avatar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-full hover:bg-gray-200/70 text-gray-600 transition-colors"
          title="Actualizar bandeja"
        >
          <RotateCw className={`w-5 h-5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
        </button>

        {/* Account Switcher Dropdown */}
        <div className="relative" ref={accountMenuRef}>
          {activeAccount ? (
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-full hover:bg-gray-200/70 border border-gray-200/70 bg-white transition-all text-left"
              title="Cambiar cuenta de correo"
            >
              {activeAccount.avatar ? (
                <img
                  src={activeAccount.avatar}
                  alt={activeAccount.email}
                  className="w-7 h-7 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center">
                  {activeAccount.email[0].toUpperCase()}
                </div>
              )}
              <div className="hidden lg:block max-w-[140px] truncate text-xs">
                <span className="font-semibold text-gray-800 block truncate">
                  {activeAccount.name || activeAccount.email.split("@")[0]}
                </span>
                <span className="text-gray-500 block truncate text-[10px]">
                  {activeAccount.email}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
          ) : (
            <button
              onClick={onConnectGmail}
              className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Conectar Gmail</span>
            </button>
          )}

          {/* Account Dropdown Menu */}
          {showAccountMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200/80 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                Cuentas de Gmail Vinculadas
              </div>

              <div className="space-y-1 my-1">
                {accounts.map((acc) => {
                  const isCurrent = acc.id === activeAccount?.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => {
                        onSelectAccount(acc);
                        setShowAccountMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                        isCurrent
                          ? "bg-blue-50/80 text-blue-900 font-semibold"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {acc.avatar ? (
                        <img
                          src={acc.avatar}
                          alt={acc.email}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {acc.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold truncate block">
                            {acc.name || acc.email}
                          </span>
                          {acc.status === "revoked" && (
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 block truncate">{acc.email}</span>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
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
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Vincular otra cuenta de Gmail</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Button & Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center transition-colors"
            title="Mi cuenta"
          >
            {user.name[0]?.toUpperCase()}
            {user.lastName[0]?.toUpperCase()}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200/80 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 bg-gray-50 rounded-xl mb-2">
                <div className="font-semibold text-sm text-gray-900">
                  {user.name} {user.lastName}
                </div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>

              <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Configuración y Cuentas</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
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
