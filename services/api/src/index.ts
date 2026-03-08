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

app.post(
  "/auth/register",
  {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
    },
  },
  async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    const normalizedEmail = email.toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await db.query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
        [normalizedEmail, passwordHash],
      );

      return reply.status(201).send({ ok: true });
    } catch (err: any) {
      if (err.code === "23505") {
        return reply.status(409).send({
          ok: false,
          error: "Email already exists",
        });
      }

      console.error("REGISTER ERROR:", err);
      app.log.error(err);
      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  },
);

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
