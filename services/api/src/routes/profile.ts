import { FastifyInstance } from "fastify";
import { authMiddleware, JwtPayload } from "../authMiddleware";

export async function profileRoute(app: FastifyInstance) {
  app.get(
    "/profile",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;

      return reply.send({
        ok: true,
        user: {
          id: user.userId,
          email: user.email,
        },
      });
    },
  );
}
