"use client";

import {
  PenSquare,
  Inbox,
  Star,
  Clock,
  Send,
  FileText,
  AlertOctagon,
  Trash2,
  ShieldCheck,
  Lock,
} from "lucide-react";

export type MailFolder =
  | "INBOX"
  | "STARRED"
  | "SNOOZED"
  | "SENT"
  | "DRAFT"
  | "SPAM"
  | "TRASH";

interface SidebarProps {
  currentFolder: MailFolder;
  onSelectFolder: (folder: MailFolder) => void;
  onOpenCompose: () => void;
  unreadCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: {
  folder: MailFolder;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { folder: "INBOX", label: "Recibidos", icon: Inbox },
  { folder: "STARRED", label: "Destacados", icon: Star },
  { folder: "SNOOZED", label: "Pospuestos", icon: Clock },
  { folder: "SENT", label: "Enviados", icon: Send },
  { folder: "DRAFT", label: "Borradores", icon: FileText },
  { folder: "SPAM", label: "Spam", icon: AlertOctagon },
  { folder: "TRASH", label: "Papelera", icon: Trash2 },
];

export default function Sidebar({
  currentFolder,
  onSelectFolder,
  onOpenCompose,
  unreadCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const content = (
    <div className="w-64 h-full flex flex-col justify-between py-5 select-none bg-[#f8fafc]/90 border-r border-slate-200/80">
      <div>
        {/* Compose Button - Styled with Jabvox Teal Gradient & Shadow */}
        <div className="px-4 mb-5">
          <button
            onClick={() => {
              onOpenCompose();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#15605A] to-[#1e7a72] hover:from-[#114b46] hover:to-[#17625b] text-white font-semibold text-sm shadow-md shadow-[#15605A]/25 hover:shadow-lg hover:shadow-[#15605A]/35 transition-all duration-200 active:scale-[0.98] group"
          >
            <PenSquare className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Redactar correo</span>
          </button>
        </div>

        {/* Navigation Folders */}
        <nav className="space-y-1 pr-3 pl-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentFolder === item.folder;

            return (
              <button
                key={item.folder}
                onClick={() => {
                  onSelectFolder(item.folder);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between pl-4 pr-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[#15605A]/12 text-[#15605A] font-bold shadow-2xs border-l-4 border-[#15605A]"
                    : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#15605A]" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.folder === "INBOX" && unreadCount > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold transition-transform ${
                      isActive
                        ? "bg-[#15605A] text-white"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Security & Connection Status Badge Card */}
      <div className="px-4 pt-4 border-t border-slate-200/70">
        <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-slate-800 tracking-tight">
                Gmail API Oficial
              </span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Tokens AES-256 &bull; TLS 1.3</span>
          </div>
        </div>

        <div className="text-[10px] text-center text-slate-400 mt-3 font-medium">
          Jabvox Workspace &bull; v2.4
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden md:block flex-shrink-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
