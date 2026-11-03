"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Mail,
  Users,
  ShieldCheck,
  Bot,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Circle,
  Menu,
  X,
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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    {
      id: "correo",
      title: "Correo",
      href: "/mail",
      icon: Mail,
      badge: "Gmail",
      active: pathname.startsWith("/mail"),
    },
    {
      id: "usuarios",
      title: "Usuarios",
      href: "/users",
      icon: Users,
      badge: null,
      active: pathname.startsWith("/users"),
    },
    {
      id: "roles",
      title: "Roles",
      href: "/roles",
      icon: ShieldCheck,
      badge: null,
      active: pathname.startsWith("/roles"),
    },
    {
      id: "ia",
      title: "Chat IA",
      href: "/ia",
      icon: Bot,
      badge: null,
      active: pathname.startsWith("/ia"),
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f6f9f9] text-[#1d3a35]">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Jabvox Main Navigation Sidebar */}
      <aside
        style={{
          background: "linear-gradient(180deg, #DAEBDB, #A8D5D3)",
          borderColor: "#8FC4C2",
        }}
        className={`h-full border-r flex flex-col justify-between transition-all duration-200 z-50 flex-shrink-0 select-none ${
          isCollapsed ? "w-[68px]" : "w-[240px]"
        } ${
          mobileMenuOpen
            ? "fixed inset-y-0 left-0 w-[260px] translate-x-0 shadow-2xl md:relative md:shadow-none"
            : "hidden md:flex"
        }`}
      >
        {/* Top Header */}
        <div className="p-3 space-y-3">
          {/* Brand header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                style={{ backgroundColor: "#15605A" }}
                className="w-8 h-8 rounded-xl text-white font-black text-base flex items-center justify-center flex-shrink-0 shadow-xs"
              >
                J
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span
                    style={{ color: "#15605A" }}
                    className="font-bold text-base tracking-tight truncate block"
                  >
                    Jabvox
                  </span>
                </div>
              )}
            </div>

            {/* Collapse toggle (desktop) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex w-7 h-7 rounded-lg items-center justify-center text-[#2d5a52] hover:bg-white/50 transition-colors"
              title={isCollapsed ? "Expandir menú" : "Contraer menú"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {/* Close drawer (mobile) */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-[#2d5a52] hover:bg-white/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Account selector pill */}
          {!isCollapsed && (
            <div className="p-2 rounded-xl bg-white/60 border border-[#8FC4C2]/60 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white text-[#15605A] font-bold text-[10px] flex items-center justify-center border border-[#8FC4C2]/50 shadow-2xs">
                  TL
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-[#15605A] block truncate text-[11px]">
                    Tecnologias Lan
                  </span>
                  <span className="text-[10px] text-[#2d5a52]/80 flex items-center gap-1">
                    <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                    Espacio de trabajo
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Main Navigation Modules */}
          <nav className="space-y-1 pt-2">
            {!isCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#15605A]/80 px-2.5 block mb-1">
                Módulos
              </span>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  title={item.title}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                    item.active
                      ? "bg-white/85 text-[#15605A] shadow-xs font-bold"
                      : "text-[#2d5a52] hover:bg-white/40"
                  } ${isCollapsed ? "justify-center px-0" : ""}`}
                >
                  {item.active && (
                    <div
                      style={{ backgroundColor: "#15605A" }}
                      className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md"
                    />
                  )}

                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      item.active ? "text-[#15605A]" : "text-[#2d5a52]"
                    }`}
                  />

                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#15605A]/15 text-[#15605A] text-[9px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Foot */}
        <div className="p-3 border-t border-[#8FC4C2]/60 bg-white/20">
          <div
            className={`flex items-center gap-2.5 ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <Link
              href="/profile"
              className="flex items-center gap-2 min-w-0 hover:opacity-85 transition-opacity"
              title="Mi perfil y ajustes"
            >
              <div className="w-8 h-8 rounded-xl bg-[#15605A] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                {user ? user.name[0]?.toUpperCase() : "U"}
              </div>

              {!isCollapsed && (
                <div className="min-w-0 text-left">
                  <span className="font-bold text-xs text-[#15605A] block truncate leading-tight">
                    {user ? `${user.name} ${user.lastName}` : "Usuario"}
                  </span>
                  <span className="text-[10px] text-[#2d5a52]/80 block truncate">
                    {user ? user.email : ""}
                  </span>
                </div>
              )}
            </Link>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-[#2d5a52] hover:text-red-700 hover:bg-white/50 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Mobile top strip with hamburger button */}
        <div className="md:hidden h-12 bg-white border-b border-gray-200 px-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div
              style={{ backgroundColor: "#15605A" }}
              className="w-6 h-6 rounded-lg text-white font-bold text-xs flex items-center justify-center"
            >
              J
            </div>
            <span style={{ color: "#15605A" }} className="font-bold text-sm">
              Jabvox
            </span>
          </div>
          <div className="w-5" />
        </div>

        {/* Content body */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
