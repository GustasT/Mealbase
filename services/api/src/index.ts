import Fastify from "fastify";
import { Client } from "pg";

const app = Fastify();

const db = new Client({
  host: "mealbase-db",
  port: 5432,
  user: "mealbase",
  password: "mealbase",
  database: "mealbase",
});

app.get("/health", async () => {
  try {
    await db.query("SELECT 1");
    return { ok: true, db: true };
  } catch (err) {
    return { ok: true, db: false };
  }
});

const start = async () => {
  await db.connect();
  await app.listen({ port: 3001, host: "0.0.0.0" });
};

start();
