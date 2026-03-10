import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = "supersecretkey";

export type JwtPayload = {
  userId: string;
  email?: string;
};

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({ ok: false, error: "Missing token" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return reply.status(401).send({ ok: false, error: "Invalid token format" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (request as any).user = payload;
  } catch {
    return reply.status(401).send({
      ok: false,
      error: "Invalid or expired token",
    });
  }
}
