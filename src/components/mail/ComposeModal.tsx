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
  List,
  Link2,
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

  // Auto-save draft debounce
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

  const processEmailInput = (
    input: string,
    chips: string[],
    setChips: (chips: string[]) => void,
    setInput: (val: string) => void
  ) => {
    const rawTokens = input.split(/[,;\s]+/);
    const valid: string[] = [];
    let leftover = "";

    rawTokens.forEach((token) => {
      const trimmed = token.trim();
      if (!trimmed) return;
      if (trimmed.includes("@") && trimmed.includes(".")) {
        if (!chips.includes(trimmed)) valid.push(trimmed);
      } else {
        leftover = trimmed;
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
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      const trimmed = input.trim().replace(/,$/, "");
      if (trimmed && trimmed.includes("@")) {
        if (!chips.includes(trimmed)) {
          setChips([...chips, trimmed]);
        }
        setInput("");
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

  const handleSaveDraft = async (isAuto = false) => {
    try {
      if (!isAuto) setSavingDraft(true);
      setError(null);

      const finalTo = [...toChips];
      if (toInput.trim() && toInput.includes("@")) finalTo.push(toInput.trim());

      const finalCc = [...ccChips];
      if (ccInput.trim() && ccInput.includes("@")) finalCc.push(ccInput.trim());

      const finalBcc = [...bccChips];
      if (bccInput.trim() && bccInput.includes("@")) finalBcc.push(bccInput.trim());

      const res = await fetch("/api/mail/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          draftId,
          to: finalTo,
          cc: finalCc,
          bcc: finalBcc,
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

    const finalTo = [...toChips];
    if (toInput.trim() && toInput.includes("@")) finalTo.push(toInput.trim());

    if (finalTo.length === 0) {
      setError("Debes ingresar al menos un correo de destinatario válido.");
      return;
    }

    setSending(true);

    try {
      const finalCc = [...ccChips];
      if (ccInput.trim() && ccInput.includes("@")) finalCc.push(ccInput.trim());

      const finalBcc = [...bccChips];
      if (bccInput.trim() && bccInput.includes("@")) finalBcc.push(bccInput.trim());

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
  const insertFormatting = (tag: "b" | "i" | "ul" | "a") => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);

    let replacement = "";
    if (tag === "b") replacement = `<b>${selected || "texto en negrita"}</b>`;
    if (tag === "i") replacement = `<i>${selected || "texto en cursiva"}</i>`;
    if (tag === "ul") replacement = `\n- ${selected || "elemento de lista"}\n`;
    if (tag === "a") {
      const url = prompt("Introduce el enlace URL:", "https://");
      if (url) replacement = `<a href="${url}">${selected || url}</a>`;
      else return;
    }

    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-10 w-72 bg-white border border-slate-300 rounded-t-2xl shadow-xl z-50 flex items-center justify-between px-4 py-3">
        <span className="text-xs font-bold text-slate-800 truncate">
          {subject || "Mensaje nuevo"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
            title="Restaurar"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
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
      className={`fixed z-50 bg-white shadow-2xl border border-slate-300 flex flex-col transition-all duration-200 ${
        isMaximized
          ? "inset-4 md:inset-8 rounded-3xl"
          : "bottom-0 right-4 md:right-12 w-full md:w-[640px] h-[560px] rounded-t-3xl"
      }`}
    >
      {/* Header Bar */}
      <div className="h-11 bg-gradient-to-r from-[#15605A] to-[#1e7a72] rounded-t-3xl px-4 flex items-center justify-between text-white select-none flex-shrink-0">
        <span className="text-xs font-bold tracking-tight">
          {initialData?.inReplyTo ? "Responder correo" : "Redactar nuevo mensaje"}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded-lg text-white/90 transition-colors"
            title="Minimizar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-white/20 rounded-lg text-white/90 transition-colors"
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
            className="p-1 hover:bg-white/20 rounded-lg text-white/90 transition-colors"
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
        <div className="border-b border-slate-100 px-4 py-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold w-10">Para</span>
          {toChips.map((chip, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
            >
              <span>{chip}</span>
              <button
                type="button"
                onClick={() => setToChips(toChips.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-red-500"
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
            className="flex-1 min-w-[140px] focus:outline-none text-slate-800 placeholder-slate-400 py-1"
          />

          <div className="flex items-center gap-2 text-[11px] text-slate-400 ml-auto">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="hover:text-[#15605A] font-medium"
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="hover:text-[#15605A] font-medium"
              >
                Cco
              </button>
            )}
          </div>
        </div>

        {/* CC */}
        {showCc && (
          <div className="border-b border-slate-100 px-4 py-2 flex flex-wrap items-center gap-1.5 text-xs animate-in fade-in duration-100">
            <span className="text-slate-400 font-semibold w-10">Cc</span>
            {ccChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
              >
                <span>{chip}</span>
                <button
                  type="button"
                  onClick={() => setCcChips(ccChips.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-500"
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
              className="flex-1 min-w-[140px] focus:outline-none text-slate-800 placeholder-slate-400 py-1"
            />
          </div>
        )}

        {/* BCC */}
        {showBcc && (
          <div className="border-b border-slate-100 px-4 py-2 flex flex-wrap items-center gap-1.5 text-xs animate-in fade-in duration-100">
            <span className="text-slate-400 font-semibold w-10">Cco</span>
            {bccChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
              >
                <span>{chip}</span>
                <button
                  type="button"
                  onClick={() => setBccChips(bccChips.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-500"
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
              className="flex-1 min-w-[140px] focus:outline-none text-slate-800 placeholder-slate-400 py-1"
            />
          </div>
        )}

        {/* Subject */}
        <div className="border-b border-slate-100 px-4 py-2.5 text-xs">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto del correo"
            className="w-full focus:outline-none text-slate-900 placeholder-slate-400 font-semibold"
          />
        </div>

        {/* Formatting Toolbar */}
        <div className="px-4 py-1.5 border-b border-slate-100 flex items-center gap-1 text-slate-500 bg-slate-50/50">
          <button
            type="button"
            onClick={() => insertFormatting("b")}
            className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
            title="Negrita"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("i")}
            className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
            title="Cursiva"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("ul")}
            className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
            title="Lista con viñetas"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("a")}
            className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
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
            placeholder="Escribe tu mensaje aquí... (Puedes arrastrar y soltar archivos adjuntos)"
            className="w-full h-full resize-none focus:outline-none text-sm text-slate-800 placeholder-slate-400 leading-relaxed font-sans"
          />
        </div>

        {/* Attachments preview chips */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-2xs"
              >
                <Paperclip className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[150px] font-medium">{att.filename}</span>
                <span className="text-[10px] text-slate-400">
                  ({Math.round(att.size / 1024)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="h-14 px-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-white rounded-b-3xl">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#15605A] hover:bg-[#114b46] text-white font-semibold text-xs shadow-md shadow-[#15605A]/25 transition-all disabled:opacity-60"
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

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Adjuntar archivos (máx. 25 MB)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

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
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Check className="w-3 h-3 text-emerald-500" />
                Guardado a las {draftSavedAt}
              </span>
            )}
          </div>

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
