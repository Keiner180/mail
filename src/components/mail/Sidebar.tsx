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
  Mail,
  Plus,
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
    <div className="w-64 h-full flex flex-col justify-between py-4 select-none">
      <div>
        {/* Compose Button - Gmail style pill */}
        <div className="px-4 mb-4">
          <button
            onClick={() => {
              onOpenCompose();
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-[#c2e7ff] hover:bg-[#b3dbf5] text-[#001d35] font-semibold text-sm shadow-sm transition-all hover:shadow duration-150 active:scale-95"
          >
            <PenSquare className="w-5 h-5 text-[#001d35]" />
            <span>Redactar</span>
          </button>
        </div>

        {/* Navigation Folders */}
        <nav className="space-y-0.5 pr-3">
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
                className={`w-full flex items-center justify-between pl-6 pr-4 py-2.5 rounded-r-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#d3e3fd] text-[#041e49] font-bold"
                    : "text-[#444746] hover:bg-[#e9eef6] hover:text-[#1f1f1f]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#041e49]" : "text-[#444746]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.folder === "INBOX" && unreadCount > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? "bg-[#041e49] text-white"
                        : "bg-blue-100 text-blue-700"
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

      {/* Footer Info */}
      <div className="px-6 text-[11px] text-gray-400">
        Jabvox Mail &bull; Conexión Oficial Gmail API
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden md:block bg-[#f6f8fc] border-r border-gray-200/60 flex-shrink-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative bg-[#f6f8fc] w-64 max-w-[80vw] h-full shadow-2xl z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
