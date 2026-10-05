const KINDS = {
  bug: { label: "🐞 Bug", color: 0xf2706b },
  sugestao: { label: "💡 Sugestão", color: 0x5aa9ff },
  elogio: { label: "💚 Elogio", color: 0xb6f03c },
  outro: { label: "💬 Outro", color: 0x727b8c },
} as const;

export type FeedbackKind = keyof typeof KINDS;
export const isFeedbackKind = (value: unknown): value is FeedbackKind => typeof value === "string" && value in KINDS;

/** Texto curto em formato de código (sem deixar o usuário quebrar a formatação com crases). */
const code = (text: string) => `\`${text.replaceAll("`", "'")}\``;

/** Mensagem do Discord para um feedback: um cartão colorido por tipo, com página e contato em campos. */
export function discordFeedbackPayload(f: { kind: FeedbackKind; message: string; contact: string | null; page: string | null; createdAt: Date }) {
  const { label, color } = KINDS[f.kind];
  const fields = [
    f.page ? { name: "Página", value: code(f.page.slice(0, 200)), inline: true } : null,
    f.contact ? { name: "Responder para", value: code(f.contact.slice(0, 150)), inline: true } : null,
  ].filter((x) => x !== null);
  return {
    // ninguém consegue marcar @everyone pelo formulário
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: label,
        description: f.message.slice(0, 1500),
        color,
        fields,
        timestamp: f.createdAt.toISOString(),
      },
    ],
  };
}
