"use client";

import { useState } from "react";
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
  onBatchAction: (action: "markRead" | "markUnread" | "star" | "unstar" | "archive" | "trash" | "spam") => void;
  onQuickAction: (id: string, action: "markRead" | "markUnread" | "archive" | "trash") => void;
  nextPageToken?: string | null;
  onNextPage: () => void;
  onPrevPage: () => void;
  hasPrevPage: boolean;
  searchActive: boolean;
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

  return date.toLocaleDateString("es-ES", { day: "numeric", month: "numeric", year: "2-digit" });
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
  const allSelected = messages.length > 0 && selectedIds.length === messages.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < messages.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Action Bar Header */}
      <div className="h-12 border-b border-gray-200/80 px-4 flex items-center justify-between bg-white select-none flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Multi-select dropdown checkbox */}
          <button
            onClick={() => onSelectAll(!allSelected)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title={allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : someSelected ? (
              <MinusSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Batch Actions when items are selected */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
              <button
                onClick={() => onBatchAction("archive")}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Archivar seleccionados"
              >
                <Archive className="w-4 h-4" />
              </button>

              <button
                onClick={() => onBatchAction("spam")}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Marcar como spam"
              >
                <AlertOctagon className="w-4 h-4" />
              </button>

              <button
                onClick={() => onBatchAction("trash")}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Mover a la papelera"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => onBatchAction("markRead")}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Marcar como leído"
              >
                <MailOpen className="w-4 h-4" />
              </button>

              <button
                onClick={() => onBatchAction("markUnread")}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Marcar como no leído"
              >
                <Mail className="w-4 h-4" />
              </button>

              <button
                onClick={() => onBatchAction("star")}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Destacar"
              >
                <Star className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{messages.length} mensajes</span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={onPrevPage}
              disabled={!hasPrevPage}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextPage}
              disabled={!nextPageToken}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm">Cargando correos...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-gray-400 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 text-gray-400">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No hay correos para mostrar</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchActive
                ? "No se encontraron mensajes que coincidan con la búsqueda."
                : "Esta carpeta está vacía."}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelected = selectedIds.includes(msg.id);

            return (
              <div
                key={msg.id}
                className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-[#f2f6fc] cursor-pointer transition-colors text-sm ${
                  msg.isUnread ? "bg-white font-semibold text-gray-950" : "bg-gray-50/40 text-gray-700"
                } ${isSelected ? "!bg-[#c2e7ff]/40" : ""}`}
                onClick={() => onOpenMessage(msg)}
              >
                {/* Checkbox & Star */}
                <div
                  className="flex items-center gap-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onToggleSelect(msg.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => onToggleStar(msg.id, msg.isStarred)}
                    className="p-1 text-gray-400 hover:text-amber-500 rounded"
                    title={msg.isStarred ? "Quitar destacado" : "Destacar"}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        msg.isStarred
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    />
                  </button>
                </div>

                {/* Sender */}
                <div className="w-44 md:w-56 truncate flex-shrink-0">
                  <span className={msg.isUnread ? "font-bold text-gray-900" : "text-gray-700"}>
                    {msg.fromName || msg.fromEmail}
                  </span>
                </div>

                {/* Subject & Snippet */}
                <div className="flex-1 min-w-0 flex items-center gap-2 truncate">
                  <span className={`truncate ${msg.isUnread ? "font-semibold text-gray-900" : "text-gray-800"}`}>
                    {msg.subject}
                  </span>
                  <span className="text-gray-400 text-xs hidden sm:inline">-</span>
                  <span className="text-gray-500 text-xs truncate hidden sm:inline font-normal">
                    {msg.snippet}
                  </span>
                </div>

                {/* Attachment Icon */}
                {msg.hasAttachments && (
                  <div className="flex-shrink-0 text-gray-400" title="Tiene archivos adjuntos">
                    <Paperclip className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Date or Hover Quick Actions */}
                <div className="flex-shrink-0 text-right min-w-[70px]">
                  {/* Default date view */}
                  <span className="text-xs text-gray-500 group-hover:hidden font-normal">
                    {formatMailDate(msg.timestamp)}
                  </span>

                  {/* Hover Quick Action Buttons */}
                  <div
                    className="hidden group-hover:flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onQuickAction(msg.id, "archive")}
                      className="p-1 hover:bg-gray-200/70 text-gray-500 hover:text-gray-800 rounded"
                      title="Archivar"
                    >
                      <Archive className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onQuickAction(msg.id, "trash")}
                      className="p-1 hover:bg-gray-200/70 text-gray-500 hover:text-red-600 rounded"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        onQuickAction(msg.id, msg.isUnread ? "markRead" : "markUnread")
                      }
                      className="p-1 hover:bg-gray-200/70 text-gray-500 hover:text-blue-600 rounded"
                      title={msg.isUnread ? "Marcar como leído" : "Marcar como no leído"}
                    >
                      {msg.isUnread ? (
                        <MailOpen className="w-4 h-4" />
                      ) : (
                        <Mail className="w-4 h-4" />
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

