import { FastifyInstance } from "fastify";
import { db } from "../db";
import { authMiddleware, JwtPayload } from "../authMiddleware";
import {
  normalizeMealRow,
  normalizeMealItemRow,
  normalizeMealProductRow,
  NormalizedMealItem,
} from "../utils/mealsNormalization";
import {
  buildResponseItemsAndTotals,
  buildMealResponse,
} from "../utils/mealsHelpers";

type MealItemInput = {
  productId: string;
  grams: number;
};

export async function mealsRoute(app: FastifyInstance) {
  // ADD A MEAL //////////

  app.post(
    "/meals",
    {
      preHandler: authMiddleware,
      schema: {
        body: {
          type: "object",
          required: ["name", "servings", "items"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            description: { type: "string", maxLength: 1000 },
            servings: { type: "integer", minimum: 1, maximum: 100 },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["productId", "grams"],
                properties: {
                  productId: { type: "string", minLength: 1 },
                  grams: {
                    type: "number",
                    exclusiveMinimum: 0,
                    maximum: 9999.9,
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;

      const { name, description, servings, items } = request.body as {
        name: string;
        description?: string;
        servings: number;
        items: MealItemInput[];
      };

      const trimmedName = name.trim();
      const trimmedDescription = description?.trim() || null;

      if (!trimmedName) {
        return reply.status(400).send({
          ok: false,
          error: "Meal name is required",
        });
      }

      const productIds = items.map((item) => item.productId);
      const uniqueProductIds = [...new Set(productIds)];

      if (uniqueProductIds.length !== productIds.length) {
        return reply.status(400).send({
          ok: false,
          error: "Duplicate products are not allowed in the same meal",
        });
      }

      const client = await db.connect();

      try {
        await client.query("BEGIN");

        const rawProductsResult = await client.query(
          `
        SELECT id, name, protein, carbs, fat
        FROM products
        WHERE user_id = $1 AND id = ANY($2::uuid[])
        `,
          [user.userId, uniqueProductIds],
        );

        const products = rawProductsResult.rows.map(normalizeMealProductRow);

        if (products.length !== uniqueProductIds.length) {
          await client.query("ROLLBACK");
          return reply.status(404).send({
            ok: false,
            error: "One or more products were not found",
          });
        }

        const productsMap = new Map(
          products.map((product) => [product.id, product]),
        );

        const mealResult = await client.query(
          `
        INSERT INTO meals (user_id, name, description, servings)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, name, description, servings, created_at
        `,
          [user.userId, trimmedName, trimmedDescription, servings],
        );

        const rawMeal = mealResult.rows[0];
        const meal = normalizeMealRow(rawMeal);

        // Sukuriam meal_products

        for (const item of items) {
          await client.query(
            `
          INSERT INTO meal_products (meal_id, product_id, grams)
          VALUES ($1, $2, $3)
          `,
            [meal.id, item.productId, item.grams],
          );
        }

        const normalizedItems: NormalizedMealItem[] = items.map((item) => {
          const product = productsMap.get(item.productId)!;

          return {
            mealId: meal.id,
            productId: item.productId,
            grams: item.grams,
            name: product.name,
            protein: product.protein,
            carbs: product.carbs,
            fat: product.fat,
          };
        });

        const { responseItems, totals } =
          buildResponseItemsAndTotals(normalizedItems);

        const mealResponse = buildMealResponse(meal, responseItems, totals);

        await client.query("COMMIT");

        return reply.status(201).send({
          ok: true,
          meal: mealResponse,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("CREATE MEAL ERROR:", err);
        app.log.error(err);

        return reply.status(500).send({
          ok: false,
          error: "Internal server error",
        });
      } finally {
        client.release();
      }
    },
  );

  // GET ALL MEALS OF USER //////////

  app.get("/meals", { preHandler: authMiddleware }, async (request, reply) => {
    const user = (request as any).user as JwtPayload;

    try {
      const rawMealsResult = await db.query(
        `
      SELECT id, user_id, name, description, servings, created_at
      FROM meals
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
        [user.userId],
      );

      const meals = rawMealsResult.rows.map(normalizeMealRow);

      if (meals.length === 0) {
        return reply.send({
          ok: true,
          meals: [],
        });
      }

      const mealIds = meals.map((meal) => meal.id);

      const rawItemsResult = await db.query(
        `
      SELECT
        mp.meal_id,
        mp.product_id,
        mp.grams,
        p.name,
        p.protein,
        p.carbs,
        p.fat
      FROM meal_products mp
      JOIN products p ON p.id = mp.product_id
      WHERE mp.meal_id = ANY($1::uuid[])
      `,
        [mealIds],
      );

      const items = rawItemsResult.rows.map(normalizeMealItemRow);

      const itemsByMealId = new Map<string, NormalizedMealItem[]>();

      for (const item of items) {
        if (!itemsByMealId.has(item.mealId)) {
          itemsByMealId.set(item.mealId, []);
        }

        itemsByMealId.get(item.mealId)!.push(item);
      }

      const mealsResponse = meals.map((meal) => {
        const mealItems = itemsByMealId.get(meal.id) || [];

        const { responseItems, totals } =
          buildResponseItemsAndTotals(mealItems);

        return buildMealResponse(meal, responseItems, totals);
      });

      return reply.send({
        ok: true,
        meals: mealsResponse,
      });
    } catch (err) {
      console.error("GET MEALS ERROR:", err);
      app.log.error(err);

      return reply.status(500).send({
        ok: false,
        error: "Internal server error",
      });
    }
  });

  // GET A MEAL BY ID //////////

  app.get(
    "/meals/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;
      const { id } = request.params as { id: string };

      try {
        const rawMealResult = await db.query(
          `
        SELECT id, user_id, name, description, servings, created_at
        FROM meals
        WHERE user_id = $1 AND id = $2
        `,
          [user.userId, id],
        );

        const rawMeal = rawMealResult.rows[0];

        if (!rawMeal) {
          return reply.status(404).send({
            ok: false,
            error: "Meal not found",
          });
        }

        const meal = normalizeMealRow(rawMeal);

        const rawItemsResult = await db.query(
          `
        SELECT
          mp.meal_id,
          mp.product_id,
          mp.grams,
          p.name,
          p.protein,
          p.carbs,
          p.fat
        FROM meal_products mp
        JOIN products p ON p.id = mp.product_id
        WHERE mp.meal_id = $1
        `,
          [meal.id],
        );

        const items = rawItemsResult.rows.map(normalizeMealItemRow);

        const { responseItems, totals } = buildResponseItemsAndTotals(items);

        const mealResponse = buildMealResponse(meal, responseItems, totals);

        return reply.status(200).send({
          ok: true,
          meal: mealResponse,
        });
      } catch (err) {
        console.error("GET MEAL ERROR:", err);
        app.log.error(err);

        return reply.status(500).send({
          ok: false,
          error: "Internal server error",
        });
      }
    },
  );

  // DELETE A MEAL //////////

  app.delete(
    "/meals/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;
      const { id } = request.params as { id: string };

      try {
        const rawDeleteResult = await db.query(
          `
        DELETE FROM meals
        WHERE
        meals.id = $1 AND user_id = $2
        RETURNING 
        id
        `,
          [id, user.userId],
        );

        const deleteResult = rawDeleteResult.rows[0];

        if (!deleteResult) {
          return reply.status(404).send({
            ok: false,
            error: "Meal not found",
          });
        }

        return reply.status(200).send({
          ok: true,
        });
      } catch (err) {
        console.error("DELETE MEAL ERROR:", err);
        app.log.error(err);

        return reply.status(500).send({
          ok: false,
          error: "Internal server error",
        });
      }
    },
  );

  // UPDATE A MEAL //////////

  app.put(
    "/meals/:id",
    {
      preHandler: authMiddleware,
      schema: {
        body: {
          type: "object",
          required: ["name", "servings", "items"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 100 },
            description: { type: "string", maxLength: 1000 },
            servings: { type: "integer", minimum: 1, maximum: 100 },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["productId", "grams"],
                properties: {
                  productId: { type: "string", minLength: 1 },
                  grams: {
                    type: "number",
                    exclusiveMinimum: 0,
                    maximum: 9999.9,
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;
      const { id } = request.params as { id: string };

      const { name, description, servings, items } = request.body as {
        name: string;
        description?: string;
        servings: number;
        items: MealItemInput[];
      };

      const trimmedName = name.trim();
      const trimmedDescription = description?.trim() || null;

      if (!trimmedName) {
        return reply.status(400).send({
          ok: false,
          error: "Meal name is required",
        });
      }

      const productIds = items.map((item) => item.productId);
      const uniqueProductIds = [...new Set(productIds)];

      if (uniqueProductIds.length !== productIds.length) {
        return reply.status(400).send({
          ok: false,
          error: "Duplicate products are not allowed in the same meal",
        });
      }

      const rawMealCheck = await db.query(
        `
      SELECT * FROM meals
      WHERE user_id = $1 AND id = $2
      `,
        [user.userId, id],
      );

      if (!rawMealCheck.rows[0]) {
        return reply.status(404).send({
          ok: false,
          error: "Meal not found",
        });
      }

      const client = await db.connect();

      try {
        await client.query("BEGIN");

        const rawProductsResult = await client.query(
          `
        SELECT id, name, protein, carbs, fat
        FROM products
        WHERE user_id = $1 AND id = ANY($2::uuid[])
        `,
          [user.userId, uniqueProductIds],
        );

        const products = rawProductsResult.rows.map(normalizeMealProductRow);

        if (products.length !== uniqueProductIds.length) {
          await client.query("ROLLBACK");
          return reply.status(404).send({
            ok: false,
            error: "One or more products were not found",
          });
        }

        const productsMap = new Map(
          products.map((product) => [product.id, product]),
        );

        const mealResult = await client.query(
          `
        UPDATE meals
        SET name = $3, description = $4, servings = $5
        WHERE user_id = $1 AND id = $2
        RETURNING id, user_id, name, description, servings, created_at
        `,
          [user.userId, id, trimmedName, trimmedDescription, servings],
        );

        const rawMeal = mealResult.rows[0];
        const meal = normalizeMealRow(rawMeal);

        // Updeitinam meal_products aka is pradziu istrinam poto pridedam isnaujo

        await client.query(
          `
        DELETE FROM meal_products
        WHERE meal_id = $1
        `,
          [meal.id],
        );

        for (const item of items) {
          await client.query(
            `
          INSERT INTO meal_products (meal_id, product_id, grams)
          VALUES ($1, $2, $3)
          `,
            [meal.id, item.productId, item.grams],
          );
        }

        const normalizedItems: NormalizedMealItem[] = items.map((item) => {
          const product = productsMap.get(item.productId)!;

          return {
            mealId: meal.id,
            productId: item.productId,
            grams: item.grams,
            name: product.name,
            protein: product.protein,
            carbs: product.carbs,
            fat: product.fat,
          };
        });

        const { responseItems, totals } =
          buildResponseItemsAndTotals(normalizedItems);

        const mealResponse = buildMealResponse(meal, responseItems, totals);

        await client.query("COMMIT");

        return reply.status(200).send({
          ok: true,
          meal: mealResponse,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("UPDATE MEAL ERROR:", err);
        app.log.error(err);

        return reply.status(500).send({
          ok: false,
          error: "Internal server error",
        });
      } finally {
        client.release();
      }
    },
  );
}
