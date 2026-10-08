"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OPEN_FEEDBACK_EVENT } from "./beta-notice";
import { Icon, type IconName } from "./icon";
import { buttonStyles } from "./ui";

const KINDS: { id: string; label: string; icon: IconName }[] = [
  { id: "bug", label: "Bug", icon: "bug" },
  { id: "sugestao", label: "Sugestão", icon: "bulb" },
  { id: "elogio", label: "Elogio", icon: "heart" },
  { id: "outro", label: "Outro", icon: "chat" },
];

type Status = { type: "idle" } | { type: "sending" } | { type: "sent" } | { type: "error"; message: string };

/** Botão flutuante de feedback: abre uma janelinha para contar um bug, sugestão ou elogio. */
export function FeedbackButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const [kind, setKind] = useState<string>("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState(""); // armadilha para robôs
  const [status, setStatus] = useState<Status>({ type: "idle" });

  // o aviso de beta (e qualquer outro lugar) pode pedir para abrir o formulário
  useEffect(() => {
    const show = () => dialogRef.current?.showModal();
    window.addEventListener(OPEN_FEEDBACK_EVENT, show);
    return () => window.removeEventListener(OPEN_FEEDBACK_EVENT, show);
  }, []);

  function open() {
    if (status.type === "sent") setStatus({ type: "idle" });
    dialogRef.current?.showModal();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!kind) return setStatus({ type: "error", message: "Escolha o tipo do feedback." });
    setStatus({ type: "sending" });
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ kind, message, contact, website, page: pathname }),
      });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        return setStatus({ type: "error", message: error ?? "Não deu para enviar agora. Tenta de novo." });
      }
      setStatus({ type: "sent" });
      setKind("");
      setMessage("");
      setContact("");
    } catch {
      setStatus({ type: "error", message: "Sem conexão. Tenta de novo." });
    }
  }

  const field = "w-full rounded-[4px] border border-line bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none";

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Dê seu feedback"
        title="Dê seu feedback"
        className="fixed bottom-4 right-4 z-40 flex size-12 items-center justify-center rounded-full border border-accent-line bg-surface text-accent shadow-[var(--float-shadow)] transition md:size-14 hover:scale-105 hover:bg-accent hover:text-accent-ink"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-6 md:size-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 9v-1a3 3 0 0 1 6 0v1" />
          <path d="M8 9h8a6 6 0 0 1 1 3v3a5 5 0 0 1-10 0v-3a6 6 0 0 1 1-3" />
          <path d="M3 13h4M17 13h4M12 20v-6M4 19l3.35-2M20 19l-3.35-2M4 7l3.75 2.4M20 7l-3.75 2.4" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Enviar feedback"
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        className="m-auto w-[min(92vw,26rem)] rounded-card border border-line-strong bg-surface-2 p-0 text-text shadow-2xl shadow-black/70 backdrop:bg-black/70"
      >
        {status.type === "sent" ? (
          <div className="p-6 text-center">
            <span aria-hidden className="mx-auto flex size-14 items-center justify-center rounded-full border border-accent-line bg-accent-soft text-accent">
              <Icon name="check" className="size-7" />
            </span>
            <p className="mt-4 font-display text-2xl font-bold uppercase">Valeu!</p>
            <p className="mt-1 text-sm text-text-2">Recebi seu feedback e vou ler com carinho.</p>
            <button type="button" onClick={() => dialogRef.current?.close()} className={`${buttonStyles.secondary} mt-5 px-4 py-2 max-md:min-h-11`}>
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide">
                  <Icon name="chat" className="size-5 text-accent" />
                  Feedback
                </h2>
                <p className="mt-1 text-xs text-muted">Achou um bug ou tem uma ideia? Conta pra mim.</p>
              </div>
              <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Fechar" className="-mr-1 p-1 text-2xl leading-none text-muted hover:text-text">
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div role="group" aria-label="Tipo" className="flex flex-wrap gap-1.5">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    aria-pressed={kind === k.id}
                    className={`inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-display text-sm font-semibold uppercase tracking-wide transition max-md:min-h-11 ${
                      kind === k.id ? "border-accent bg-accent text-accent-ink" : "border-line text-text-2 hover:border-accent hover:text-accent"
                    }`}
                  >
                    <Icon name={k.icon} className="size-4" />
                    {k.label}
                  </button>
                ))}
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-text-2">Mensagem</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={5}
                  maxLength={1500}
                  rows={5}
                  placeholder={kind === "bug" ? "O que aconteceu? Em que jogo ou página?" : "Escreve aqui…"}
                  className={`${field} resize-y`}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-text-2">
                  Contato <span className="font-normal text-muted">(opcional, para eu poder te responder)</span>
                </span>
                <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} placeholder="E-mail ou @" className={field} />
              </label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-0 opacity-0" />

              {status.type === "error" && (
                <p role="alert" className="flex items-start gap-2 rounded-[4px] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
                  {status.message}
                </p>
              )}
              <button type="submit" disabled={status.type === "sending"} className={`${buttonStyles.primary} w-full disabled:opacity-60`}>
                {status.type === "sending" ? "Enviando…" : "Enviar feedback"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
