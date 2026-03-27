import { FastifyInstance } from "fastify";
import { db } from "../db";
import { authMiddleware, JwtPayload } from "../authMiddleware";
import { normalizeProductRow } from "../utils/productsNormalization";

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
            name: { type: "string", minLength: 1, maxLength: 50 },
            protein: { type: "number", minimum: 0, maximum: 100 },
            carbs: { type: "number", minimum: 0, maximum: 100 },
            fat: { type: "number", minimum: 0, maximum: 100 },
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

      const total = protein + carbs + fat;

      if (total > 103) {
        return reply.status(400).send({
          ok: false,
          error: "Macros sum cannot exceed 103g",
        });
      }

      try {
        const result = await db.query(
          `
          INSERT INTO products (user_id, name, protein, carbs, fat)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, user_id, name, protein, carbs, fat, created_at
          `,
          [user.userId, name.trim(), protein, carbs, fat],
        );

        const product = normalizeProductRow(result.rows[0]);

        return reply.status(201).send({
          ok: true,
          product: {
            ...product,
            calories: Number(
              (
                product.protein * 4 +
                product.carbs * 4 +
                product.fat * 9
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

  // Get products of an user
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

        const products = result.rows.map((row) => {
          const product = normalizeProductRow(row);

          return {
            ...product,
            calories: Number(
              (
                product.protein * 4 +
                product.carbs * 4 +
                product.fat * 9
              ).toFixed(0),
            ),
          };
        });

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

  // Get product by id
  app.get(
    "/products/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;
      const { id } = request.params as { id: string };

      try {
        const rawProductResult = await db.query(
          `
          SELECT id, user_id, name, protein, carbs, fat, created_at
          FROM products
          WHERE user_id = $1 AND id = $2
          `,
          [user.userId, id],
        );

        const rawProduct = rawProductResult.rows[0];

        if (!rawProduct) {
          return reply.status(404).send({
            ok: false,
            error: "Product not found",
          });
        }

        const product = normalizeProductRow(rawProduct);

        return reply.send({
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
        console.error("GET PRODUCT BY ID ERROR:", err);
        app.log.error(err);

        return reply.status(500).send({
          ok: false,
          error: "Internal server error",
        });
      }
    },
  );

  // Delete product by id
  app.delete(
    "/products/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;
      const { id } = request.params as { id: string };

      try {
        const result = await db.query(
          `
          DELETE
          FROM products
          WHERE user_id = $1 AND id = $2
          RETURNING id
          `,
          [user.userId, id],
        );

        const deleted = result.rows[0];

        if (!deleted) {
          return reply.status(404).send({
            ok: false,
            error: "Product not found",
          });
        }
        return reply.send({
          ok: true,
        });
      } catch (err) {
        console.error("DELETE PRODUCT ERROR:", err);
        app.log.error(err);

        return reply.status(500).send({
          ok: false,
          error: "Internal server error",
        });
      }
    },
  );

  app.put(
    "/products/:id",
    {
      preHandler: authMiddleware,
      schema: {
        body: {
          type: "object",
          required: ["name", "protein", "carbs", "fat"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 50 },
            protein: { type: "number", minimum: 0, maximum: 100 },
            carbs: { type: "number", minimum: 0, maximum: 100 },
            fat: { type: "number", minimum: 0, maximum: 100 },
          },
        },
      },
    },

    async (request, reply) => {
      const user = (request as any).user as JwtPayload;
      const { id } = request.params as { id: string };

      const { name, protein, carbs, fat } = request.body as {
        name: string;
        protein: number;
        carbs: number;
        fat: number;
      };

      const total = protein + carbs + fat;

      if (total > 103) {
        return reply.status(400).send({
          ok: false,
          error: "Macros sum cannot exceed 103g",
        });
      }

      try {
        const rawProductResult = await db.query(
          `
          UPDATE products
          SET name = $3, protein = $4, carbs = $5, fat = $6
          WHERE user_id = $1 AND id = $2
          RETURNING id, user_id, name, protein, carbs, fat, created_at
          `,
          [user.userId, id, name.trim(), protein, carbs, fat],
        );

        const rawProduct = rawProductResult.rows[0];

        if (!rawProduct) {
          return reply.status(404).send({
            ok: false,
          });
        }

        const product = normalizeProductRow(rawProduct);

        return reply.status(200).send({
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
        console.error("UPDATE PRODUCT ERROR:", err);
        app.log.error(err);

        return reply.status(500).send({
          ok: false,
          error: "Internal server error",
        });
      }
    },
  );
}
