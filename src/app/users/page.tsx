import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import JabvoxAppLayout from "@/components/layout/JabvoxAppLayout";
import { Users, Plus, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <JabvoxAppLayout user={user}>
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-auto">
        {/* Module Sub-Header */}
        <header className="h-14 min-h-14 bg-[#FAFBFB] border-b border-gray-200/90 px-4 md:px-6 flex items-center justify-between flex-shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#15605A]/10 text-[#15605A] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Gestión • Usuarios</h1>
              <p className="text-[10px] text-gray-500">Gestión de usuarios y accesos del espacio</p>
            </div>
          </div>

          <button
            disabled
            className="px-3.5 py-2 rounded-xl bg-[#15605A]/20 text-[#15605A] text-xs font-semibold flex items-center gap-2 cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </header>

        {/* Empty State Body */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200/80 p-8 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Módulo de Usuarios</h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Este módulo se encuentra actualmente vacío. La funcionalidad activa y configurada es el módulo de <strong>Correo</strong>.
            </p>
          </div>
        </div>
      </div>
    </JabvoxAppLayout>
  );
}
