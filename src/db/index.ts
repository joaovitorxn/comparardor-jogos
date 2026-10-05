import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/app.db";

function connect(): Client {
  if (DATABASE_URL.startsWith("file:")) {
    // o libsql não cria a pasta do arquivo sozinho
    mkdirSync(path.dirname(DATABASE_URL.slice("file:".length)), { recursive: true });
  }
  const client = createClient({
    url: DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  // WAL permite o site e os scripts de coleta usarem o banco ao mesmo tempo
  if (DATABASE_URL.startsWith("file:")) {
    void client.execute("PRAGMA journal_mode = WAL");
    void client.execute("PRAGMA busy_timeout = 5000");
  }
  return client;
}

// Reaproveita a conexão entre recarregamentos do `next dev`
const globalForDb = globalThis as unknown as { libsqlClient?: Client };
const client = globalForDb.libsqlClient ?? connect();
if (process.env.NODE_ENV !== "production") globalForDb.libsqlClient = client;

export const db = drizzle(client, { schema });
export { schema };
