import { FAQ_ITEMS, faqJsonLd } from "@/lib/faq";
import { JsonLd } from "./json-ld";

/**
 * Perguntas frequentes: cada uma é um <details> comum (abre com clique, Enter ou espaço) e a resposta continua na página,
 * então não some para os buscadores.
 */
export function Faq() {
  return (
    <>
      <JsonLd data={faqJsonLd()} />
      <div className="divide-y divide-line rounded-card border border-line bg-surface">
        {FAQ_ITEMS.map(({ question, answer }) => (
          <details key={question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-sm font-medium transition hover:text-accent max-md:min-h-11 [&::-webkit-details-marker]:hidden">
              {question}
              <svg viewBox="0 0 24 24" aria-hidden className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-text-2">{answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}
