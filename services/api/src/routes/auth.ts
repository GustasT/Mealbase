import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function authRoute(app: FastifyInstance) {
  // Register
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

  // Login
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
          "SELECT id, email, password_hash FROM users WHERE email = $1",
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

        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: "7d" },
        );

        return reply.send({ ok: true, token });
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
}
