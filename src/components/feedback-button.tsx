"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

const KINDS = [
  { id: "bug", label: "Bug" },
  { id: "sugestao", label: "Sugestão" },
  { id: "elogio", label: "Elogio" },
  { id: "outro", label: "Outro" },
] as const;

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

  const field = "w-full rounded-[4px] border border-line bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none";

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Enviar feedback"
        title="Bug, sugestão ou elogio"
        className="fixed bottom-4 right-4 z-40 flex size-12 items-center justify-center rounded-full border border-accent-line bg-surface text-accent shadow-lg shadow-black/40 transition hover:scale-105 hover:bg-accent hover:text-accent-ink"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
          <path d="M8.5 11h7M8.5 14h4" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-card border border-line-strong bg-surface p-0 text-text backdrop:bg-black/60"
      >
        {status.type === "sent" ? (
          <div className="space-y-4 p-6 text-center">
            <p className="font-display text-2xl font-bold uppercase text-accent">Valeu!</p>
            <p className="text-sm text-text-2">Recebemos seu feedback e vamos ler com carinho.</p>
            <button type="button" onClick={() => dialogRef.current?.close()} className="h-9 rounded-[4px] border border-line px-4 text-sm font-medium hover:border-accent hover:text-accent">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold uppercase">Feedback</h2>
                <p className="text-xs text-text-2">Achou um bug ou tem uma ideia? Conta pra gente.</p>
              </div>
              <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Fechar" className="text-xl leading-none text-muted hover:text-text">
                ×
              </button>
            </div>

            <div role="group" aria-label="Tipo" className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKind(k.id)}
                  aria-pressed={kind === k.id}
                  className={`h-8 rounded-[4px] border px-3 text-sm font-medium transition ${
                    kind === k.id ? "border-accent bg-accent text-accent-ink" : "border-line text-text-2 hover:border-accent hover:text-accent"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={5}
              maxLength={1500}
              rows={5}
              placeholder={kind === "bug" ? "O que aconteceu? Em que jogo ou página?" : "Escreve aqui…"}
              className={`${field} resize-y`}
              aria-label="Mensagem"
            />
            <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} placeholder="E-mail ou @ para resposta (opcional)" className={field} aria-label="Contato (opcional)" />
            <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-0 opacity-0" />

            {status.type === "error" && (
              <p className="text-sm text-danger" role="alert">
                {status.message}
              </p>
            )}
            <button
              type="submit"
              disabled={status.type === "sending"}
              className="h-10 w-full rounded-[4px] bg-accent font-display text-sm font-bold uppercase tracking-wider text-accent-ink transition hover:brightness-110 disabled:opacity-60"
            >
              {status.type === "sending" ? "Enviando…" : "Enviar"}
            </button>
          </form>
        )}
      </dialog>
    </>
  );
}
