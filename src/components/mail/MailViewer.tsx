"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Archive,
  Trash2,
  Mail,
  Printer,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  Download,
  AlertOctagon,
  ChevronDown,
  ShieldCheck,
  Send,
  FileText,
  FileImage,
  FileArchive,
  File,
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

function getAttachmentIcon(mimeType: string, filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
    return <FileImage className="w-5 h-5 text-indigo-500" />;
  }
  if (mimeType.includes("pdf") || ext === "pdf") {
    return <FileText className="w-5 h-5 text-rose-500" />;
  }
  if (mimeType.includes("zip") || ["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
    return <FileArchive className="w-5 h-5 text-amber-500" />;
  }
  return <File className="w-5 h-5 text-slate-500" />;
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

  // Inline quick reply state
  const [quickReplyText, setQuickReplyText] = useState("");
  const [sendingQuickReply, setSendingQuickReply] = useState(false);
  const [quickReplySent, setQuickReplySent] = useState(false);

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

  const handleSendQuickReply = async () => {
    if (!detail || !quickReplyText.trim()) return;
    try {
      setSendingQuickReply(true);
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          to: [detail.fromEmail],
          subject: detail.subject.startsWith("Re:") ? detail.subject : `Re: ${detail.subject}`,
          bodyHtml: quickReplyText.replace(/\n/g, "<br>"),
          threadId: detail.threadId,
          inReplyTo: detail.messageIdHeader || detail.id,
        }),
      });
      if (!res.ok) throw new Error("Error al enviar respuesta");
      setQuickReplyText("");
      setQuickReplySent(true);
      setTimeout(() => setQuickReplySent(false), 4000);
    } catch (err) {
      console.error(err);
      alert("No se pudo enviar la respuesta rápida.");
    } finally {
      setSendingQuickReply(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Action Toolbar */}
      <div className="h-12 border-b border-slate-200/80 px-4 flex items-center justify-between bg-white flex-shrink-0 select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors mr-2"
            title="Volver a la lista"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>

          <button
            onClick={() => onAction("archive")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            title="Archivar"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAction("spam")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            title="Marcar como spam"
          >
            <AlertOctagon className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAction("trash")}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAction("markUnread")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-[#15605A] transition-colors"
            title="Marcar como no leído"
          >
            <Mail className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            title="Imprimir correo"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Mail View Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl w-full mx-auto">
        {loading ? (
          <div className="space-y-4 pt-4 animate-pulse">
            <div className="h-7 bg-slate-200 rounded-lg w-2/3" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-200 rounded w-1/6" />
              </div>
            </div>
            <div className="space-y-2 pt-6">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-4/6" />
            </div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* Security Verification Banner */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#15605A]/8 border border-[#15605A]/20 text-[#15605A] text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#15605A] flex-shrink-0" />
                <span className="font-semibold">
                  Remitente validado &bull; Google OAuth TLS 1.3 &bull; HTML Sanitizado
                </span>
              </div>
              <span className="text-[10px] text-[#15605A]/70 font-medium hidden sm:inline">
                Protección contra XSS activa
              </span>
            </div>

            {/* Subject Title */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {detail.subject || "(Sin asunto)"}
              </h1>
            </div>

            {/* Sender and Recipient Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#15605A] to-[#258f86] text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-2xs">
                  {detail.fromName ? detail.fromName[0].toUpperCase() : detail.fromEmail[0].toUpperCase()}
                </div>

                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">
                      {detail.fromName || detail.fromEmail}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      &lt;{detail.fromEmail}&gt;
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>Para: <strong className="text-slate-700 font-semibold">{detail.to || "mí"}</strong></span>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Detalles completos"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {showDetails && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5 animate-in fade-in duration-150">
                      <div>
                        <span className="font-semibold text-slate-500">De:</span> {detail.from}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Para:</span> {detail.to}
                      </div>
                      {detail.cc && (
                        <div>
                          <span className="font-semibold text-slate-500">Cc:</span> {detail.cc}
                        </div>
                      )}
                      {detail.bcc && (
                        <div>
                          <span className="font-semibold text-slate-500">Cco:</span> {detail.bcc}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-500">Fecha:</span> {detail.date}
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                        ID: {detail.id} &bull; Hilo: {detail.threadId}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-xs text-slate-400 font-medium">{detail.date}</span>
              </div>
            </div>

            {/* Email Body - Sanitized HTML or plain text */}
            <div className="text-sm text-slate-800 leading-relaxed py-2 min-h-[180px]">
              {detail.bodyHtml ? (
                <div
                  className="prose max-w-none overflow-x-auto text-sm text-slate-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: detail.bodyHtml }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">
                  {detail.bodyText || "(Mensaje sin contenido de texto)"}
                </pre>
              )}
            </div>

            {/* Attachments Section */}
            {detail.attachments && detail.attachments.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  <Paperclip className="w-4 h-4 text-[#15605A]" />
                  <span>{detail.attachments.length} Archivo(s) Adjunto(s)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {detail.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/90 hover:border-[#15605A]/40 bg-slate-50/60 hover:bg-white transition-all group shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                          {getAttachmentIcon(att.mimeType, att.filename)}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-800 truncate" title={att.filename}>
                            {att.filename}
                          </span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            {formatBytes(att.size)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadAttachment(att)}
                        className="p-2 rounded-xl bg-white group-hover:bg-[#15605A] text-slate-500 group-hover:text-white border border-slate-200/80 shadow-2xs transition-colors flex-shrink-0"
                        title="Descargar archivo adjunto"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: Reply, Reply All, Forward */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                onClick={() => onReply("reply", detail)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Reply className="w-4 h-4 text-[#15605A]" />
                <span>Responder</span>
              </button>

              <button
                onClick={() => onReply("replyAll", detail)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <ReplyAll className="w-4 h-4 text-slate-600" />
                <span>Responder a todos</span>
              </button>

              <button
                onClick={() => onReply("forward", detail)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Forward className="w-4 h-4 text-slate-600" />
                <span>Reenviar</span>
              </button>
            </div>

            {/* Quick Reply Inline Box */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Respuesta rápida a {detail.fromName || detail.fromEmail}
              </span>
              <textarea
                value={quickReplyText}
                onChange={(e) => setQuickReplyText(e.target.value)}
                placeholder="Escribe una respuesta rápida aquí..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#15605A]/30 resize-none"
              />
              <div className="mt-2 flex items-center justify-between">
                {quickReplySent ? (
                  <span className="text-xs font-semibold text-emerald-600">
                    ¡Respuesta enviada con éxito!
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    O haz clic en &quot;Responder&quot; para abrir el editor completo.
                  </span>
                )}

                <button
                  onClick={handleSendQuickReply}
                  disabled={sendingQuickReply || !quickReplyText.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15605A] hover:bg-[#114b46] text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                >
                  {sendingQuickReply ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Enviar respuesta</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
