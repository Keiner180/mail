"use client";

import { useState, useMemo } from "react";
import {
  CheckSquare,
  Square,
  MinusSquare,
  Star,
  Trash2,
  Mail,
  MailOpen,
  Archive,
  AlertOctagon,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Filter,
} from "lucide-react";
import { EmailMessageSummary } from "@/lib/gmail/service";

interface MailListProps {
  messages: EmailMessageSummary[];
  loading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (all: boolean) => void;
  onOpenMessage: (message: EmailMessageSummary) => void;
  onToggleStar: (id: string, currentStarred: boolean) => void;
  onBatchAction: (
    action: "markRead" | "markUnread" | "star" | "unstar" | "archive" | "trash" | "spam"
  ) => void;
  onQuickAction: (
    id: string,
    action: "markRead" | "markUnread" | "archive" | "trash"
  ) => void;
  nextPageToken?: string | null;
  onNextPage: () => void;
  onPrevPage: () => void;
  hasPrevPage: boolean;
  searchActive: boolean;
}

type FilterTab = "all" | "unread" | "starred" | "attachments";

const AVATAR_COLORS = [
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
];

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function formatMailDate(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
  });
}

export default function MailList({
  messages,
  loading,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpenMessage,
  onToggleStar,
  onBatchAction,
  onQuickAction,
  nextPageToken,
  onNextPage,
  onPrevPage,
  hasPrevPage,
  searchActive,
}: MailListProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Local filter tabs for quick in-memory segmentation
  const filteredMessages = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return messages.filter((m) => m.isUnread);
      case "starred":
        return messages.filter((m) => m.isStarred);
      case "attachments":
        return messages.filter((m) => m.hasAttachments);
      case "all":
      default:
        return messages;
    }
  }, [messages, activeTab]);

  const allSelected =
    filteredMessages.length > 0 && selectedIds.length === filteredMessages.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < filteredMessages.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Top Filter and Actions Toolbar */}
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-xs select-none flex-shrink-0">
        {/* Quick Filter Tabs */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1 gap-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "all"
                  ? "bg-[#15605A] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Todos ({messages.length})
            </button>

            <button
              onClick={() => setActiveTab("unread")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "unread"
                  ? "bg-[#15605A] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>No leídos</span>
              {messages.filter((m) => m.isUnread).length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "unread"
                      ? "bg-white text-[#15605A]"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {messages.filter((m) => m.isUnread).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("starred")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === "starred"
                  ? "bg-[#15605A] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Star className="w-3 h-3" />
              <span>Destacados</span>
            </button>

            <button
              onClick={() => setActiveTab("attachments")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === "attachments"
                  ? "bg-[#15605A] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Paperclip className="w-3 h-3" />
              <span>Con adjuntos</span>
            </button>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
            <span className="text-[11px] font-medium hidden sm:inline">
              Página {hasPrevPage ? "> 1" : "1"}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={onPrevPage}
                disabled={!hasPrevPage}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNextPage}
                disabled={!nextPageToken}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Row: Selection and Batch Buttons */}
        <div className="h-10 px-4 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectAll(!allSelected)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title={allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-[#15605A]" />
              ) : someSelected ? (
                <MinusSquare className="w-4 h-4 text-[#15605A]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                <span className="text-xs font-semibold text-slate-700 mr-1">
                  {selectedIds.length} sel.
                </span>

                <button
                  onClick={() => onBatchAction("archive")}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Archivar"
                >
                  <Archive className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onBatchAction("spam")}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Marcar como spam"
                >
                  <AlertOctagon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onBatchAction("trash")}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                  title="Mover a la papelera"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onBatchAction("markRead")}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Marcar como leído"
                >
                  <MailOpen className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onBatchAction("markUnread")}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Marcar como no leído"
                >
                  <Mail className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onBatchAction("star")}
                  className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-600 hover:text-amber-500 transition-colors"
                  title="Destacar seleccionados"
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Mostrando {filteredMessages.length} mensaje(s)
          </div>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          /* Shimmer Skeleton Loading */
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/70 border border-slate-100 animate-pulse"
              >
                <div className="w-4 h-4 rounded bg-slate-200" />
                <div className="w-8 h-8 rounded-full bg-slate-200" />
                <div className="w-40 h-4 rounded bg-slate-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-3/4 h-3.5 rounded bg-slate-200" />
                  <div className="w-1/2 h-2.5 rounded bg-slate-200" />
                </div>
                <div className="w-14 h-3 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400 px-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-700">No hay correos en esta vista</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {searchActive
                ? "No se encontraron mensajes que coincidan con la búsqueda ingresada."
                : activeTab !== "all"
                ? "No hay correos que coincidan con el filtro seleccionado."
                : "Esta carpeta está vacía actualmente."}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isSelected = selectedIds.includes(msg.id);
            const senderInitial = (
              msg.fromName ? msg.fromName[0] : msg.fromEmail ? msg.fromEmail[0] : "?"
            ).toUpperCase();
            const avatarColorClass = getAvatarColor(msg.fromEmail || msg.fromName);

            return (
              <div
                key={msg.id}
                onClick={() => onOpenMessage(msg)}
                className={`group flex items-center gap-3 px-4 py-3 hover:bg-slate-50/90 cursor-pointer transition-all text-sm border-l-4 ${
                  msg.isUnread
                    ? "bg-white border-l-[#15605A] font-semibold text-slate-950"
                    : "bg-[#fafafa]/50 border-l-transparent text-slate-600"
                } ${isSelected ? "!bg-[#15605A]/8 !border-l-[#15605A]" : ""}`}
              >
                {/* Checkbox and Star */}
                <div
                  className="flex items-center gap-2.5 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onToggleSelect(msg.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#15605A]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </button>

                  <button
                    onClick={() => onToggleStar(msg.id, msg.isStarred)}
                    className="p-1 text-slate-300 hover:text-amber-500 rounded transition-colors"
                    title={msg.isStarred ? "Quitar destacado" : "Destacar"}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        msg.isStarred
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 hover:text-slate-500"
                      }`}
                    />
                  </button>
                </div>

                {/* Avatar Initials */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border shadow-2xs ${avatarColorClass}`}
                  title={msg.from}
                >
                  {senderInitial}
                </div>

                {/* Sender Name */}
                <div className="w-36 md:w-52 truncate flex-shrink-0">
                  <span
                    className={
                      msg.isUnread ? "font-bold text-slate-900" : "font-normal text-slate-700"
                    }
                  >
                    {msg.fromName || msg.fromEmail}
                  </span>
                </div>

                {/* Subject and Snippet */}
                <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                  <span
                    className={`truncate text-sm ${
                      msg.isUnread
                        ? "font-semibold text-slate-950"
                        : "font-normal text-slate-800"
                    }`}
                  >
                    {msg.subject || "(Sin asunto)"}
                  </span>
                  <span className="text-slate-300 text-xs hidden sm:inline">&bull;</span>
                  <span className="text-slate-400 text-xs truncate hidden sm:inline font-normal">
                    {msg.snippet}
                  </span>
                </div>

                {/* Attachment Pill Indicator */}
                {msg.hasAttachments && (
                  <div
                    className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px]"
                    title="Tiene archivos adjuntos"
                  >
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    <span className="hidden md:inline font-medium">Adjunto</span>
                  </div>
                )}

                {/* Date or Hover Quick Actions */}
                <div className="flex-shrink-0 text-right min-w-[76px]">
                  {/* Default date view */}
                  <span className="text-xs text-slate-400 group-hover:hidden font-medium">
                    {formatMailDate(msg.timestamp)}
                  </span>

                  {/* Hover Quick Action Buttons */}
                  <div
                    className="hidden group-hover:flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onQuickAction(msg.id, "archive")}
                      className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                      title="Archivar"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onQuickAction(msg.id, "trash")}
                      className="p-1.5 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        onQuickAction(msg.id, msg.isUnread ? "markRead" : "markUnread")
                      }
                      className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-[#15605A] rounded-lg transition-colors"
                      title={msg.isUnread ? "Marcar como leído" : "Marcar como no leído"}
                    >
                      {msg.isUnread ? (
                        <MailOpen className="w-3.5 h-3.5" />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
