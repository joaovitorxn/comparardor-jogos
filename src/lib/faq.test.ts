import { describe, expect, it } from "vitest";
import { FAQ_ITEMS, faqJsonLd } from "./faq";

describe("FAQ", () => {
  it("tem 6 perguntas, todas com resposta", () => {
    expect(FAQ_ITEMS).toHaveLength(6);
    for (const { question, answer } of FAQ_ITEMS) {
      expect(question.trim().endsWith("?")).toBe(true);
      expect(answer.trim().length).toBeGreaterThan(40);
    }
  });

  it("não repete pergunta", () => {
    expect(new Set(FAQ_ITEMS.map((i) => i.question)).size).toBe(FAQ_ITEMS.length);
  });

  it("explica o Hypar", () => {
    expect(FAQ_ITEMS.some((i) => i.question === "O que é Hypar?")).toBe(true);
  });

  it("gera o JSON-LD FAQPage com uma entrada por pergunta", () => {
    const ld = faqJsonLd();
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(FAQ_ITEMS.length);
    expect(ld.mainEntity[0]).toEqual({
      "@type": "Question",
      name: FAQ_ITEMS[0].question,
      acceptedAnswer: { "@type": "Answer", text: FAQ_ITEMS[0].answer },
    });
  });
});
