import { FastifyInstance } from "fastify";
import { db } from "../db";
import { authMiddleware, JwtPayload } from "../authMiddleware";

export async function productsRoute(app: FastifyInstance) {
  app.post(
    "/products",
    {
      preHandler: authMiddleware,
      schema: {
        body: {
          type: "object",
          required: ["name", "protein", "carbs", "fat"],
          properties: {
            name: { type: "string", minLength: 1 },
            protein: { type: "number", minimum: 0 },
            carbs: { type: "number", minimum: 0 },
            fat: { type: "number", minimum: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;

      const { name, protein, carbs, fat } = request.body as {
        name: string;
        protein: number;
        carbs: number;
        fat: number;
      };

      try {
        const result = await db.query(
          `
          INSERT INTO products (user_id, name, protein, carbs, fat)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, user_id, name, protein, carbs, fat, created_at
          `,
          [user.userId, name.trim(), protein, carbs, fat],
        );

        const product = result.rows[0];

        return reply.status(201).send({
          ok: true,
          product: {
            ...product,
            calories: Number(
              (
                Number(product.protein) * 4 +
                Number(product.carbs) * 4 +
                Number(product.fat) * 9
              ).toFixed(0),
            ),
          },
        });
      } catch (err) {
        console.error("CREATE PRODUCT ERROR:", err);
        app.log.error(err);

        return reply.status(500).send({
          ok: false,
          error: "Internal server error",
        });
      }
    },
  );

  app.get(
    "/products",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;

      try {
        const result = await db.query(
          `
          SELECT id, user_id, name, protein, carbs, fat, created_at
          FROM products
          WHERE user_id = $1
          ORDER BY created_at DESC
          `,
          [user.userId],
        );

        const products = result.rows.map((product) => ({
          ...product,
          calories: Number(
            (
              Number(product.protein) * 4 +
              Number(product.carbs) * 4 +
              Number(product.fat) * 9
            ).toFixed(0),
          ),
        }));

        return reply.send({
          ok: true,
          products,
        });
      } catch (err) {
        console.error("GET PRODUCTS ERROR:", err);
        app.log.error(err);

        return reply.status(500).send({
          ok: false,
          error: "Internal server error",
        });
      }
    },
  );
}
