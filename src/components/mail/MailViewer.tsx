"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Archive,
  Trash2,
  Mail,
  MailOpen,
  Printer,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  Download,
  AlertOctagon,
  ChevronDown,
  User,
} from "lucide-react";
import { EmailMessageDetail, EmailMessageSummary, AttachmentInfo } from "@/lib/gmail/service";

interface MailViewerProps {
  messageSummary: EmailMessageSummary;
  accountId: string;
  onBack: () => void;
  onAction: (action: "archive" | "trash" | "spam" | "markUnread") => void;
  onReply: (type: "reply" | "replyAll" | "forward", message: EmailMessageDetail) => void;
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function MailViewer({
  messageSummary,
  accountId,
  onBack,
  onAction,
  onReply,
}: MailViewerProps) {
  const [detail, setDetail] = useState<EmailMessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchMessageDetail();
  }, [messageSummary.id, accountId]);

  const fetchMessageDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/mail/messages/${messageSummary.id}?accountId=${accountId}`
      );
      if (!res.ok) {
        throw new Error("No se pudo cargar el mensaje completo");
      }
      const data = await res.json();
      setDetail(data.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadAttachment = (att: AttachmentInfo) => {
    const url = `/api/mail/attachment?accountId=${accountId}&messageId=${messageSummary.id}&attachmentId=${att.id}&filename=${encodeURIComponent(
      att.filename
    )}&mimeType=${encodeURIComponent(att.mimeType)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Action Toolbar */}
      <div className="h-12 border-b border-gray-200/80 px-4 flex items-center justify-between bg-white flex-shrink-0 select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors mr-2"
            title="Volver a la lista"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => onAction("archive")}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Archivar"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAction("spam")}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Marcar como spam"
          >
            <AlertOctagon className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAction("trash")}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAction("markUnread")}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Marcar como no leído"
          >
            <Mail className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Imprimir correo"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Mail View Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl w-full mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm">Cargando contenido del correo...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* Subject Title */}
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {detail.subject}
              </h1>
            </div>

            {/* Sender and Recipient Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  {detail.fromName ? detail.fromName[0].toUpperCase() : detail.fromEmail[0].toUpperCase()}
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      {detail.fromName || detail.fromEmail}
                    </span>
                    <span className="text-xs text-gray-500">
                      &lt;{detail.fromEmail}&gt;
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <span>Para: {detail.to || "mí"}</span>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="p-0.5 text-gray-400 hover:text-gray-600"
                      title="Mostrar detalles de destinatarios"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {showDetails && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs text-gray-700 space-y-1">
                      <div>
                        <span className="font-semibold text-gray-500">De:</span> {detail.from}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-500">Para:</span> {detail.to}
                      </div>
                      {detail.cc && (
                        <div>
                          <span className="font-semibold text-gray-500">CC:</span> {detail.cc}
                        </div>
                      )}
                      {detail.bcc && (
                        <div>
                          <span className="font-semibold text-gray-500">CCO:</span> {detail.bcc}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-500">Fecha:</span> {detail.date}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-xs text-gray-500">{detail.date}</span>
              </div>
            </div>

            {/* Email Body - Render sanitized HTML or plain text */}
            <div className="text-sm text-gray-800 leading-relaxed py-2 min-h-[160px]">
              {detail.bodyHtml ? (
                <div
                  className="prose max-w-none overflow-x-auto text-sm"
                  dangerouslySetInnerHTML={{ __html: detail.bodyHtml }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {detail.bodyText || "(Mensaje sin contenido)"}
                </pre>
              )}
            </div>

            {/* Attachments Section */}
            {detail.attachments && detail.attachments.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                  <Paperclip className="w-4 h-4" />
                  <span>{detail.attachments.length} Archivos Adjuntos</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {detail.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-white transition-all group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block text-xs font-medium text-gray-900 truncate">
                          {att.filename}
                        </span>
                        <span className="block text-[11px] text-gray-400 mt-0.5">
                          {formatBytes(att.size)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDownloadAttachment(att)}
                        className="p-2 rounded-lg bg-white group-hover:bg-blue-50 text-gray-500 group-hover:text-blue-600 border border-gray-200/80 shadow-xs transition-colors flex-shrink-0"
                        title="Descargar archivo"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Quick Reply Action Buttons */}
            <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onReply("reply", detail)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>Responder</span>
              </button>

              <button
                onClick={() => onReply("replyAll", detail)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <ReplyAll className="w-4 h-4" />
                <span>Responder a todos</span>
              </button>

              <button
                onClick={() => onReply("forward", detail)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <Forward className="w-4 h-4" />
                <span>Reenviar</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

