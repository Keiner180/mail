"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Paperclip,
  Trash2,
  Send,
  Save,
  Check,
  AlertCircle,
} from "lucide-react";

export interface OutgoingAttachment {
  filename: string;
  mimeType: string;
  contentBase64: string;
  size: number;
}

export interface ComposeInitialData {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  bodyHtml?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
  draftId?: string;
}

interface ComposeModalProps {
  accountId: string;
  initialData?: ComposeInitialData | null;
  onClose: () => void;
  onSentSuccess?: () => void;
}

export default function ComposeModal({
  accountId,
  initialData,
  onClose,
  onSentSuccess,
}: ComposeModalProps) {
  const [to, setTo] = useState<string>(initialData?.to?.join(", ") || "");
  const [cc, setCc] = useState<string>(initialData?.cc?.join(", ") || "");
  const [bcc, setBcc] = useState<string>(initialData?.bcc?.join(", ") || "");
  const [showCc, setShowCc] = useState(Boolean(initialData?.cc?.length));
  const [showBcc, setShowBcc] = useState(Boolean(initialData?.bcc?.length));
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [body, setBody] = useState(initialData?.bodyHtml || "");
  const [attachments, setAttachments] = useState<OutgoingAttachment[]>([]);
  const [draftId, setDraftId] = useState<string | undefined>(initialData?.draftId);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save draft debounce
  useEffect(() => {
    if (!to && !subject && !body) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveDraft(true);
    }, 15000); // Auto-save after 15s of inactivity

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [to, cc, bcc, subject, body, attachments]);

  const parseEmails = (input: string): string[] => {
    return input
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes("@"));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: OutgoingAttachment[] = [];
    let currentTotalSize = attachments.reduce((sum, a) => sum + a.size, 0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      if (currentTotalSize + file.size > 25 * 1024 * 1024) {
        setError("El tamaño total de los archivos adjuntos no puede superar los 25 MB.");
        break;
      }

      currentTotalSize += file.size;

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          // Strip data:...;base64, prefix
          const base64Data = res.split(",")[1] || "";
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        contentBase64: base64,
        size: file.size,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async (isAuto = false) => {
    try {
      if (!isAuto) setSavingDraft(true);
      setError(null);

      const toList = parseEmails(to);
      const ccList = parseEmails(cc);
      const bccList = parseEmails(bcc);

      const res = await fetch("/api/mail/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          draftId,
          to: toList,
          cc: ccList,
          bcc: bccList,
          subject,
          bodyHtml: body,
          attachments,
          threadId: initialData?.threadId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar borrador");

      if (data.draftId) {
        setDraftId(data.draftId);
      }
      setDraftSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err: unknown) {
      if (!isAuto) {
        const msg = err instanceof Error ? err.message : "Error al guardar borrador";
        setError(msg);
      }
    } finally {
      if (!isAuto) setSavingDraft(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const toList = parseEmails(to);
    if (toList.length === 0) {
      setError("Debes ingresar al menos un correo de destinatario válido");
      return;
    }

    setSending(true);

    try {
      const ccList = parseEmails(cc);
      const bccList = parseEmails(bcc);

      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          to: toList,
          cc: ccList.length > 0 ? ccList : undefined,
          bcc: bccList.length > 0 ? bccList : undefined,
          subject: subject || "(Sin asunto)",
          bodyHtml: body.replace(/\n/g, "<br>"),
          attachments,
          threadId: initialData?.threadId,
          inReplyTo: initialData?.inReplyTo,
          references: initialData?.references,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el correo");
      }

      if (onSentSuccess) onSentSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-10 w-72 bg-[#f2f6fc] border border-gray-300 rounded-t-xl shadow-lg z-50 flex items-center justify-between px-4 py-2.5">
        <span className="text-xs font-semibold text-gray-800 truncate">
          {subject || "Mensaje nuevo"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title="Restaurar"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 bg-white shadow-2xl border border-gray-300 flex flex-col transition-all duration-150 ${
        isMaximized
          ? "inset-4 md:inset-10 rounded-2xl"
          : "bottom-0 right-4 md:right-12 w-full md:w-[600px] h-[540px] rounded-t-2xl"
      }`}
    >
      {/* Header Bar */}
      <div className="h-10 bg-[#f2f6fc] rounded-t-2xl px-4 flex items-center justify-between border-b border-gray-200 select-none flex-shrink-0">
        <span className="text-xs font-bold text-gray-800 truncate">
          {initialData?.inReplyTo ? "Responder correo" : "Mensaje nuevo"}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Minimizar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title={isMaximized ? "Restaurar tamaño" : "Pantalla completa"}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSend} className="flex-1 flex flex-col min-h-0">
        {/* Recipients: TO */}
        <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-semibold w-10">Para</span>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="destinatario@correo.com"
            className="flex-1 focus:outline-none text-gray-800 placeholder-gray-400"
          />
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="hover:text-blue-600 font-medium"
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="hover:text-blue-600 font-medium"
              >
                Cco
              </button>
            )}
          </div>
        </div>

        {/* CC */}
        {showCc && (
          <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-2 text-xs animate-in fade-in duration-100">
            <span className="text-gray-400 font-semibold w-10">Cc</span>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="copia@correo.com"
              className="flex-1 focus:outline-none text-gray-800 placeholder-gray-400"
            />
          </div>
        )}

        {/* BCC */}
        {showBcc && (
          <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-2 text-xs animate-in fade-in duration-100">
            <span className="text-gray-400 font-semibold w-10">Cco</span>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="copia-oculta@correo.com"
              className="flex-1 focus:outline-none text-gray-800 placeholder-gray-400"
            />
          </div>
        )}

        {/* Subject */}
        <div className="border-b border-gray-100 px-4 py-2 text-xs">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto"
            className="w-full focus:outline-none text-gray-800 placeholder-gray-400 font-medium"
          />
        </div>

        {/* Body Text Area */}
        <div className="flex-1 px-4 py-3 min-h-0">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escribe tu mensaje aquí..."
            className="w-full h-full resize-none focus:outline-none text-sm text-gray-800 placeholder-gray-400 leading-relaxed font-sans"
          />
        </div>

        {/* Attachments preview chips */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 shadow-2xs"
              >
                <Paperclip className="w-3 h-3 text-gray-400" />
                <span className="truncate max-w-[140px]">{att.filename}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="h-14 px-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-60"
            >
              {sending ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Enviar</span>
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Adjuntar archivos (máx. 25 MB)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSaveDraft(false)}
              disabled={savingDraft}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Guardar borrador"
            >
              <Save className="w-4 h-4" />
            </button>

            {draftSavedAt && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" />
                Guardado {draftSavedAt}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Descartar borrador"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
