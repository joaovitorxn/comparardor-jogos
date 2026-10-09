import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, DATABASE_URL } from "@/db";
import { games, hypes } from "@/db/schema";
import { DELETE, POST } from "./route";

const VOTER = "11111111-2222-3333-4444-555555555555";
let gameId = 0;

function vote(body: unknown, ip = "9.9.9.9") {
  return POST(
    new Request("http://localhost/api/hype", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip, "user-agent": "Mozilla/5.0" },
      body: JSON.stringify(body),
    }) as never,
  );
}
function unvote(body: unknown, ip = "7.7.7.7") {
  return DELETE(
    new Request("http://localhost/api/hype", {
      method: "DELETE",
      headers: { "content-type": "application/json", "x-forwarded-for": ip, "user-agent": "Mozilla/5.0" },
      body: JSON.stringify(body),
    }) as never,
  );
}
const countFor = async (id: number) => (await db.select().from(hypes).where(eq(hypes.gameId, id))).length;

// os testes apagam hypes do primeiro jogo: nunca contra um banco remoto (produção)
describe.skipIf(!DATABASE_URL.startsWith("file:"))("POST /api/hype", () => {
  beforeAll(async () => {
    const [g] = await db.select({ id: games.id }).from(games).limit(1);
    gameId = g.id;
    await db.delete(hypes).where(eq(hypes.gameId, gameId));
  });
  afterAll(async () => {
    await db.delete(hypes).where(eq(hypes.gameId, gameId));
  });

    it("conta um voto e ignora o mesmo votante de novo", async () => {
      expect((await vote({ gameId, voter: VOTER })).status).toBe(204);
      await vote({ gameId, voter: VOTER });
      expect(await countFor(gameId)).toBe(1);
    });

    it("limita os votos de um mesmo IP no mesmo jogo, mesmo com votantes novos a cada pedido", async () => {
      await db.delete(hypes).where(eq(hypes.gameId, gameId));
      for (let i = 0; i < 8; i++) await vote({ gameId, voter: `00000000-0000-0000-0000-00000000000${i}` }, "8.8.8.8");
      expect(await countFor(gameId)).toBe(5);
    });

    it("desfaz o voto de quem votou e não mexe no de outros", async () => {
    await db.delete(hypes).where(eq(hypes.gameId, gameId));
    const OTHER = "99999999-2222-3333-4444-555555555555";
    await vote({ gameId, voter: VOTER }, "6.6.6.6");
    await vote({ gameId, voter: OTHER }, "6.6.6.7");
    expect(await countFor(gameId)).toBe(2);
    expect((await unvote({ gameId, voter: VOTER })).status).toBe(204);
    expect(await countFor(gameId)).toBe(1);
    // desfazer de novo, ou um votante que nunca votou, não faz nada
    await unvote({ gameId, voter: VOTER });
    await unvote({ gameId, voter: "aaaaaaaa-2222-3333-4444-555555555555" });
    await unvote({ gameId: -1, voter: VOTER });
    expect(await countFor(gameId)).toBe(1);
  });

  it("ignora entrada inválida e jogo inexistente", async () => {
      for (const body of [{ gameId: -1, voter: VOTER }, { gameId: "x", voter: VOTER }, { gameId, voter: "curto" }, { gameId: 999_999_999, voter: VOTER }, null]) {
        expect((await vote(body)).status).toBe(204);
      }
      expect(await countFor(999_999_999)).toBe(0);
    });
  });
