import "dotenv/config";
import { mkdirSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

mkdirSync("data", { recursive: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./data/app.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
