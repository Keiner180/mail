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
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
} from "lucide-react";

export interface OutgoingAttachment {
  filename: string;
  mimeType: string;
  contentBase64: string; // standard base64
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

const EMAIL_REGEX = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function extractCleanEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match ? match[1] : raw).replace(/[<>]/g, "").replace(/[,;]+$/, "").trim();
}

export default function ComposeModal({
  accountId,
  initialData,
  onClose,
  onSentSuccess,
}: ComposeModalProps) {
  const [toChips, setToChips] = useState<string[]>(initialData?.to || []);
  const [toInput, setToInput] = useState("");

  const [ccChips, setCcChips] = useState<string[]>(initialData?.cc || []);
  const [ccInput, setCcInput] = useState("");

  const [bccChips, setBccChips] = useState<string[]>(initialData?.bcc || []);
  const [bccInput, setBccInput] = useState("");

  const [showCc, setShowCc] = useState(Boolean(initialData?.cc?.length));
  const [showBcc, setShowBcc] = useState(Boolean(initialData?.bcc?.length));

  const [subject, setSubject] = useState(initialData?.subject || "");
  const [body, setBody] = useState(initialData?.bodyHtml || "");
  const [attachments, setAttachments] = useState<OutgoingAttachment[]>([]);
  const [draftId, setDraftId] = useState<string | undefined>(initialData?.draftId);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save draft debounce every 15s if there is any content
  useEffect(() => {
    if (toChips.length === 0 && !toInput && !subject && !body) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveDraft(true);
    }, 15000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [toChips, toInput, ccChips, bccChips, subject, body, attachments]);

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to send
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toChips, toInput, ccChips, ccInput, bccChips, bccInput, subject, body, attachments]);

  const processEmailInput = (
    input: string,
    chips: string[],
    setChips: (chips: string[]) => void,
    setInput: (val: string) => void
  ) => {
    const tokens = input.split(/[,;\s]+/);
    const valid: string[] = [];
    let leftover = "";

    tokens.forEach((token) => {
      const email = extractCleanEmail(token);
      if (!email) return;
      if (EMAIL_REGEX.test(email)) {
        if (!chips.includes(email) && !valid.includes(email)) {
          valid.push(email);
        }
      } else {
        leftover = token;
      }
    });

    if (valid.length > 0) {
      setChips([...chips, ...valid]);
      setInput(leftover);
    }
  };

  const handleKeyDownRecipient = (
    e: React.KeyboardEvent<HTMLInputElement>,
    chips: string[],
    setChips: (chips: string[]) => void,
    input: string,
    setInput: (val: string) => void
  ) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === "Tab") {
      e.preventDefault();
      const email = extractCleanEmail(input);
      if (email && EMAIL_REGEX.test(email)) {
        if (!chips.includes(email)) {
          setChips([...chips, email]);
        }
        setInput("");
      } else if (email) {
        setError(`El correo '${email}' no tiene un formato válido (ejemplo: usuario@correo.com)`);
      }
    } else if (e.key === "Backspace" && !input && chips.length > 0) {
      setChips(chips.slice(0, -1));
    }
  };

  const handleFileChange = async (files: FileList | null) => {
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

  const collectRecipients = (chips: string[], input: string): string[] => {
    const list = [...chips];
    if (input.trim()) {
      const tokens = input.split(/[,;\s]+/);
      for (const t of tokens) {
        const email = extractCleanEmail(t);
        if (email && EMAIL_REGEX.test(email) && !list.includes(email)) {
          list.push(email);
        }
      }
    }
    return list;
  };

  const handleSaveDraft = async (isAuto = false) => {
    try {
      if (!isAuto) setSavingDraft(true);
      setError(null);

      const finalTo = collectRecipients(toChips, toInput);
      const finalCc = collectRecipients(ccChips, ccInput);
      const finalBcc = collectRecipients(bccChips, bccInput);

      const res = await fetch("/api/mail/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          draftId,
          to: finalTo,
          cc: finalCc.length > 0 ? finalCc : undefined,
          bcc: finalBcc.length > 0 ? finalBcc : undefined,
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

    const finalTo = collectRecipients(toChips, toInput);

    if (finalTo.length === 0) {
      setError("Debes ingresar al menos un correo de destinatario válido (ejemplo: usuario@correo.com).");
      return;
    }

    setSending(true);

    try {
      const finalCc = collectRecipients(ccChips, ccInput);
      const finalBcc = collectRecipients(bccChips, bccInput);

      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          to: finalTo,
          cc: finalCc.length > 0 ? finalCc : undefined,
          bcc: finalBcc.length > 0 ? finalBcc : undefined,
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
      const msg = err instanceof Error ? err.message : "Error inesperado al enviar";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  // Text formatting helpers
  const insertFormatting = (tag: "b" | "i" | "u" | "ul" | "ol" | "a") => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);

    let replacement = "";
    if (tag === "b") replacement = `<b>${selected || "texto en negrita"}</b>`;
    if (tag === "i") replacement = `<i>${selected || "texto en cursiva"}</i>`;
    if (tag === "u") replacement = `<u>${selected || "texto subrayado"}</u>`;
    if (tag === "ul") replacement = `\n- ${selected || "elemento de lista"}\n`;
    if (tag === "ol") replacement = `\n1. ${selected || "primer paso"}\n`;
    if (tag === "a") {
      const url = prompt("Introduce el enlace URL:", "https://");
      if (url) replacement = `<a href="${url}">${selected || url}</a>`;
      else return;
    }

    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);
  };

  // =========================================================================
  // MINIMIZED DOCK BAR (Exact Webmail Bottom Bar)
  // =========================================================================
  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-0 right-4 sm:right-10 w-72 bg-[#202124] text-white rounded-t-xl shadow-2xl z-[100] h-10 px-4 flex items-center justify-between cursor-pointer border border-slate-700 hover:bg-[#2c2d30] transition-all select-none"
        title="Clic para expandir redacción"
      >
        <span className="text-xs font-bold truncate max-w-[170px]">
          {subject || "Mensaje nuevo"}
        </span>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-white/20 rounded text-white/90 hover:text-white transition-colors"
            title="Restaurar ventana"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-white/20 rounded text-white/90 hover:text-white transition-colors"
            title="Guardar y cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // NORMAL / EXPANDED COMPOSE MODAL (Gmail / Webmail Authentic Layout)
  // =========================================================================
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        handleFileChange(e.dataTransfer.files);
      }}
      className={`fixed z-[100] bg-white shadow-2xl border border-slate-300 flex flex-col transition-all duration-200 select-none ${
        isMaximized
          ? "inset-3 md:inset-8 rounded-2xl"
          : "bottom-0 right-4 sm:right-8 md:right-12 w-[calc(100vw-32px)] sm:w-[560px] md:w-[620px] max-w-[95vw] h-[580px] max-h-[calc(100vh-80px)] rounded-t-2xl"
      }`}
    >
      {/* ========================================================= */}
      {/* HEADER BAR with Minimizar, Maximizar, and Cerrar (X) */}
      {/* ========================================================= */}
      <div className="h-10 bg-[#202124] text-white rounded-t-2xl px-4 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-bold tracking-tight truncate max-w-[320px]">
          {initialData?.inReplyTo ? `Responder: ${subject || "correo"}` : "Mensaje nuevo"}
        </span>

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          {/* Minimizar Button (-) */}
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-white/20 rounded-md text-white/90 hover:text-white transition-colors flex items-center justify-center"
            title="Minimizar"
            aria-label="Minimizar"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Maximizar / Restaurar Button */}
          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 hover:bg-white/20 rounded-md text-white/90 hover:text-white transition-colors flex items-center justify-center"
            title={isMaximized ? "Salir de pantalla completa" : "Pantalla completa"}
            aria-label={isMaximized ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </button>

          {/* Cerrar Button (X) */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-md text-white/90 hover:text-white transition-colors flex items-center justify-center"
            title="Guardar y cerrar"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Error Notification Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-700 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSend} className="flex-1 flex flex-col min-h-0 select-text">
        {/* Recipients: PARA */}
        <div className="border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-semibold w-12 text-xs">Para</span>
          {toChips.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
            >
              <span>{chip}</span>
              <button
                type="button"
                onClick={() => setToChips(toChips.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-red-600 transition-colors"
                title={`Eliminar ${chip}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={toInput}
            onChange={(e) => {
              setToInput(e.target.value);
              processEmailInput(e.target.value, toChips, setToChips, setToInput);
            }}
            onKeyDown={(e) =>
              handleKeyDownRecipient(e, toChips, setToChips, toInput, setToInput)
            }
            placeholder={toChips.length === 0 ? "destinatario@correo.com" : ""}
            className="flex-1 min-w-[160px] focus:outline-none text-slate-800 placeholder-slate-400 py-1 text-xs"
          />

          <div className="flex items-center gap-2.5 text-xs text-slate-500 ml-auto select-none">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="hover:text-[#15605A] font-semibold hover:underline"
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="hover:text-[#15605A] font-semibold hover:underline"
              >
                Cco
              </button>
            )}
          </div>
        </div>

        {/* CC Row */}
        {showCc && (
          <div className="border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-1.5 text-xs bg-slate-50/50">
            <span className="text-slate-500 font-semibold w-12 text-xs">Cc</span>
            {ccChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
              >
                <span>{chip}</span>
                <button
                  type="button"
                  onClick={() => setCcChips(ccChips.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={ccInput}
              onChange={(e) => {
                setCcInput(e.target.value);
                processEmailInput(e.target.value, ccChips, setCcChips, setCcInput);
              }}
              onKeyDown={(e) =>
                handleKeyDownRecipient(e, ccChips, setCcChips, ccInput, setCcInput)
              }
              placeholder="copia@correo.com"
              className="flex-1 min-w-[160px] focus:outline-none text-slate-800 placeholder-slate-400 py-1 text-xs bg-transparent"
            />
          </div>
        )}

        {/* BCC Row */}
        {showBcc && (
          <div className="border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-1.5 text-xs bg-slate-50/50">
            <span className="text-slate-500 font-semibold w-12 text-xs">Cco</span>
            {bccChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
              >
                <span>{chip}</span>
                <button
                  type="button"
                  onClick={() => setBccChips(bccChips.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={bccInput}
              onChange={(e) => {
                setBccInput(e.target.value);
                processEmailInput(e.target.value, bccChips, setBccChips, setBccInput);
              }}
              onKeyDown={(e) =>
                handleKeyDownRecipient(e, bccChips, setBccChips, bccInput, setBccInput)
              }
              placeholder="copia-oculta@correo.com"
              className="flex-1 min-w-[160px] focus:outline-none text-slate-800 placeholder-slate-400 py-1 text-xs bg-transparent"
            />
          </div>
        )}

        {/* Subject Row */}
        <div className="border-b border-slate-200 px-4 py-2 text-xs">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto"
            className="w-full focus:outline-none text-slate-900 placeholder-slate-400 font-semibold text-sm"
          />
        </div>

        {/* Formatting Toolbar */}
        <div className="px-4 py-1.5 border-b border-slate-100 flex items-center gap-1 text-slate-500 bg-slate-50/70 select-none">
          <button
            type="button"
            onClick={() => insertFormatting("b")}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 transition-colors"
            title="Negrita (Ctrl + B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("i")}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 transition-colors"
            title="Cursiva (Ctrl + I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("u")}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 transition-colors"
            title="Subrayado (Ctrl + U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting("ul")}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 transition-colors"
            title="Lista con viñetas"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("ol")}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 transition-colors"
            title="Lista numerada"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("a")}
            className="p-1.5 hover:bg-slate-200/80 rounded text-slate-700 transition-colors"
            title="Insertar enlace"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body Text Area */}
        <div
          className={`flex-1 px-4 py-3 min-h-0 relative ${
            isDraggingOver ? "bg-[#15605A]/5 border-2 border-dashed border-[#15605A]" : ""
          }`}
        >
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escribe tu mensaje aquí..."
            className="w-full h-full resize-none focus:outline-none text-sm text-slate-800 placeholder-slate-400 leading-relaxed font-sans"
          />
        </div>

        {/* Attachments preview list */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/80 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-2xs"
              >
                <Paperclip className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[160px] font-medium">{att.filename}</span>
                <span className="text-[10px] text-slate-400">
                  ({Math.round(att.size / 1024)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                  title="Quitar archivo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Actions Footer */}
        <div className="h-14 px-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-white select-none">
          <div className="flex items-center gap-3">
            {/* Main Send Button */}
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#15605A] hover:bg-[#0f4641] text-white font-bold text-xs shadow-md shadow-[#15605A]/20 transition-all disabled:opacity-60 cursor-pointer active:scale-95"
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
              onChange={(e) => handleFileChange(e.target.files)}
            />

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Adjuntar archivos (máx. 25 MB)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Save Draft Button */}
            <button
              type="button"
              onClick={() => handleSaveDraft(false)}
              disabled={savingDraft}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Guardar borrador"
            >
              <Save className="w-4 h-4" />
            </button>

            {draftSavedAt && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium hidden sm:inline-flex">
                <Check className="w-3 h-3 text-emerald-500" />
                Borrador guardado a las {draftSavedAt}
              </span>
            )}
          </div>

          {/* Discard Draft Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Descartar borrador"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
