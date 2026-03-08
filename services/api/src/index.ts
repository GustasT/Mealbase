import Fastify from "fastify";
import { db } from "./db";
import bcrypt from "bcrypt";

const app = Fastify();

app.get("/health", async () => {
  try {
    await db.query("SELECT 1");
    return { ok: true, db: true };
  } catch (err) {
    return { ok: true, db: false };
  }
});

const start = async () => {
  try {
    await db.query("SELECT 1"); // test connection
    await app.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Server running on port 3001");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
