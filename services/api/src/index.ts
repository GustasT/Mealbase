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

// Registracija
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

// Loginas
app.post(
  "/auth/login",
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

    try {
      const result = await db.query(
        "SELECT id, password_hash FROM users WHERE email = $1",
        [normalizedEmail],
      );

      const user = result.rows[0];

      if (!user) {
        return reply.status(401).send({
          ok: false,
          error: "Invalid email or password",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        return reply.status(401).send({
          ok: false,
          error: "Invalid email or password",
        });
      }

      return reply.send({ ok: true, user: { id: user.id, email: user.email } });
    } catch (err) {
      console.error("LOGIN ERROR:", err);
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
