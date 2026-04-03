import { FastifyInstance } from "fastify";
import { authMiddleware, JwtPayload } from "../authMiddleware";
import { db } from "../db";

export async function profileRoute(app: FastifyInstance) {
  app.get(
    "/profile",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;

      try {
        const result = await db.query(
          `
                SELECT id, email
                FROM users
                WHERE id = $1
                `,
          [user.userId],
        );

        if (!result.rows[0]) {
          return reply.code(401).send({
            ok: false,
            error: "Unauthorized",
          });
        }

        const profileResponse = result.rows[0];

        return reply.send({
          ok: true,
          user: {
            userId: profileResponse.id,
            email: profileResponse.email,
          },
        });
      } catch (err) {
        return reply.status(500).send({
          ok: false,
          error: "Internal server error",
        });
      }
    },
  );
}
