import { describe, expect, it } from "vitest";
import { parsePcRequirements, parseSteamRequirements } from "./requirements";

describe("parseSteamRequirements", () => {
  it("parses the usual list format and drops the section title", () => {
    const html =
      '<strong>Mínimos:</strong><br><ul class="bb_ul"><li>Requer um processador e sistema operacional de 64 bits<br></li>' +
      "<li><strong>SO:</strong> Windows 10<br></li><li><strong>Memória:</strong> 4 GB de RAM<br></li>" +
      "<li><strong>Placa de vídeo:</strong> GeForce GTX 560 Ti (1GB), Radeon HD 7750 (1GB)</li></ul>";
    expect(parseSteamRequirements(html)).toEqual([
      { label: null, value: "Requer um processador e sistema operacional de 64 bits" },
      { label: "SO", value: "Windows 10" },
      { label: "Memória", value: "4 GB de RAM" },
      { label: "Placa de vídeo", value: "GeForce GTX 560 Ti (1GB), Radeon HD 7750 (1GB)" },
    ]);
  });

  it("handles labels with the colon outside the strong tag", () => {
    expect(parseSteamRequirements("<ul><li><strong>OS</strong>: Windows 11</li></ul>")).toEqual([
      { label: "OS", value: "Windows 11" },
    ]);
  });

  it("falls back to line breaks when there is no list", () => {
    expect(parseSteamRequirements("<strong>Minimum:</strong><br>OS: Windows XP<br>2 GB RAM")).toEqual([
      { label: null, value: "OS: Windows XP" },
      { label: null, value: "2 GB RAM" },
    ]);
  });

  it("strips nested tags and decodes entities", () => {
    expect(parseSteamRequirements('<ul><li><strong>Obs.:</strong> <a href="x">Ray tracing</a> &amp; DLSS&nbsp;3</li></ul>')).toEqual([
      { label: "Obs.", value: "Ray tracing & DLSS 3" },
    ]);
  });
});

describe("parsePcRequirements", () => {
  it("returns null for games without requirements (Steam sends an empty array)", () => {
    expect(parsePcRequirements([])).toBeNull();
    expect(parsePcRequirements(undefined)).toBeNull();
  });
});
