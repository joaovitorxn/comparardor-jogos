import { describe, expect, it } from "vitest";
import { brazilianPortuguese, flagFor, parseSupportedLanguages } from "./languages";

const HADES = "Inglês<strong>*</strong>, Francês, Português (Brasil), Chinês simplificado<br><strong>*</strong>idiomas com suporte total de áudio";

describe("parseSupportedLanguages", () => {
  it("lê os nomes e marca os que têm áudio", () => {
    expect(parseSupportedLanguages(HADES)).toEqual([
      { name: "Inglês", audio: true },
      { name: "Francês", audio: false },
      { name: "Português (Brasil)", audio: false },
      { name: "Chinês simplificado", audio: false },
    ]);
  });

  it("devolve lista vazia quando o jogo não informa idiomas", () => {
    expect(parseSupportedLanguages(undefined)).toEqual([]);
    expect(parseSupportedLanguages("")).toEqual([]);
  });

  it("funciona sem a nota de rodapé", () => {
    expect(parseSupportedLanguages("Inglês, Alemão")).toEqual([
      { name: "Inglês", audio: false },
      { name: "Alemão", audio: false },
    ]);
  });
});

describe("brazilianPortuguese", () => {
  it("acha o português do Brasil e ignora o de Portugal", () => {
    expect(brazilianPortuguese(parseSupportedLanguages(HADES))?.name).toBe("Português (Brasil)");
    expect(brazilianPortuguese([{ name: "Português - Portugal", audio: false }])).toBeNull();
  });
});

describe("flagFor", () => {
  it("escolhe a bandeira pelo idioma, com as variantes que têm bandeira própria", () => {
    expect(flagFor("Inglês")).toBe("gb");
    expect(flagFor("Português (Brasil)")).toBe("br");
    expect(flagFor("Português - Portugal")).toBe("pt");
    expect(flagFor("Espanhol (Espanha)")).toBe("es");
    expect(flagFor("Espanhol - América Latina")).toBe("mx");
    expect(flagFor("Chinês simplificado")).toBe("cn");
    expect(flagFor("Chinês tradicional")).toBe("tw");
  });

  it("devolve null para idiomas sem bandeira óbvia", () => {
    expect(flagFor("Esperanto")).toBeNull();
  });
});
