import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { games, hypes } from "@/db/schema";
import { POST } from "./route";

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
const countFor = async (id: number) => (await db.select().from(hypes).where(eq(hypes.gameId, id))).length;

beforeAll(async () => {
  const [g] = await db.select({ id: games.id }).from(games).limit(1);
  gameId = g.id;
  await db.delete(hypes).where(eq(hypes.gameId, gameId));
});
afterAll(async () => {
  await db.delete(hypes).where(eq(hypes.gameId, gameId));
});

describe("POST /api/hype", () => {
  it("conta um voto e ignora o mesmo votante de novo", async () => {
    expect((await vote({ gameId, voter: VOTER })).status).toBe(204);
    await vote({ gameId, voter: VOTER });
    expect(await countFor(gameId)).toBe(1);
  });

  it("ignora entrada inválida e jogo inexistente", async () => {
    for (const body of [{ gameId: -1, voter: VOTER }, { gameId: "x", voter: VOTER }, { gameId, voter: "curto" }, { gameId: 999_999_999, voter: VOTER }, null]) {
      expect((await vote(body)).status).toBe(204);
    }
    expect(await countFor(999_999_999)).toBe(0);
    expect(await countFor(gameId)).toBe(1);
  });
});
