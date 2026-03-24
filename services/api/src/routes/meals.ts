import { FastifyInstance } from "fastify";
import { db } from "../db";
import { authMiddleware, JwtPayload } from "../authMiddleware";

type MealItemInput = {
  productId: string;
  grams: number;
};

export async function mealsRoute(app: FastifyInstance) {
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
        items: MealItemInput[]; ///////////////////////////////////////
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

        const productsResult = await client.query(
          `
          SELECT id, name, protein, carbs, fat
          FROM products
          WHERE user_id = $1 AND id = ANY($2::uuid[])
          `,
          [user.userId, uniqueProductIds],
        );

        if (productsResult.rows.length !== uniqueProductIds.length) {
          await client.query("ROLLBACK");
          return reply.status(404).send({
            ok: false,
            error: "One or more products were not found",
          });
        }

        ///// issaugom viska mape pagal id kad nereiketu kiekviena karta eiti per masyva ieskant produkto
        const productsMap = new Map(
          productsResult.rows.map((product) => [product.id, product]),
        );
        ///

        const mealResult = await client.query(
          `
          INSERT INTO meals (user_id, name, description, servings)
          VALUES ($1, $2, $3, $4)
          RETURNING id, user_id, name, description, servings, created_at
          `,
          [user.userId, trimmedName, trimmedDescription, servings],
        );

        const meal = mealResult.rows[0];

        for (const item of items) {
          await client.query(
            `
            INSERT INTO meal_products (meal_id, product_id, grams)
            VALUES ($1, $2, $3)
            `,
            [meal.id, item.productId, item.grams],
          );
        }

        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        const responseItems = items.map((item) => {
          const product = productsMap.get(item.productId)!;

          const protein = Number(
            ((Number(product.protein) * item.grams) / 100).toFixed(1),
          );
          const carbs = Number(
            ((Number(product.carbs) * item.grams) / 100).toFixed(1),
          );
          const fat = Number(
            ((Number(product.fat) * item.grams) / 100).toFixed(1),
          );
          const calories = Number(
            (protein * 4 + carbs * 4 + fat * 9).toFixed(0),
          );

          totalProtein += protein;
          totalCarbs += carbs;
          totalFat += fat;

          return {
            productId: item.productId,
            name: product.name,
            grams: item.grams,
            protein,
            carbs,
            fat,
            calories,
          };
        });

        totalProtein = Number(totalProtein.toFixed(1));
        totalCarbs = Number(totalCarbs.toFixed(1));
        totalFat = Number(totalFat.toFixed(1));

        const totalCalories = Number(
          (totalProtein * 4 + totalCarbs * 4 + totalFat * 9).toFixed(0),
        );

        const perServingProtein = Number((totalProtein / servings).toFixed(1));
        const perServingCarbs = Number((totalCarbs / servings).toFixed(1));
        const perServingFat = Number((totalFat / servings).toFixed(1));
        const perServingCalories = Number(
          (
            perServingProtein * 4 +
            perServingCarbs * 4 +
            perServingFat * 9
          ).toFixed(0),
        );

        await client.query("COMMIT");

        return reply.status(201).send({
          ok: true,
          meal: {
            ...meal,
            items: responseItems,
            total: {
              protein: totalProtein,
              carbs: totalCarbs,
              fat: totalFat,
              calories: totalCalories,
            },
            perServing: {
              protein: perServingProtein,
              carbs: perServingCarbs,
              fat: perServingFat,
              calories: perServingCalories,
            },
          },
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

  /// GET all meals of user

  app.get("/meals", { preHandler: authMiddleware }, async (request, reply) => {
    const user = (request as any).user as JwtPayload;

    try {
      const mealsResult = await db.query(
        `
        SELECT id, user_id, name, description, servings, created_at
        FROM meals
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [user.userId],
      );

      const meals = mealsResult.rows;

      if (meals.length === 0) {
        return reply.send({
          ok: true,
          meals: [],
        });
      }

      const mealIds = meals.map((meal) => meal.id);

      const itemsResult = await db.query(
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

      const itemsByMealId = new Map<string, any[]>();

      for (const item of itemsResult.rows) {
        if (!itemsByMealId.has(item.meal_id)) {
          itemsByMealId.set(item.meal_id, []);
        }

        itemsByMealId.get(item.meal_id)!.push(item);
      }

      const responseMeals = meals.map((meal) => {
        const items = itemsByMealId.get(meal.id) || [];

        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalCalories = 0;

        const responseItems = items.map((item) => {
          const protein = Number(
            ((Number(item.protein) * Number(item.grams)) / 100).toFixed(1),
          );
          const carbs = Number(
            ((Number(item.carbs) * Number(item.grams)) / 100).toFixed(1),
          );
          const fat = Number(
            ((Number(item.fat) * Number(item.grams)) / 100).toFixed(1),
          );
          const calories = Number(
            (protein * 4 + carbs * 4 + fat * 9).toFixed(0),
          );

          totalProtein += protein;
          totalCarbs += carbs;
          totalFat += fat;
          totalCalories += calories;

          return {
            productId: item.product_id,
            name: item.name,
            grams: Number(item.grams),
            protein,
            carbs,
            fat,
            calories,
          };
        });

        totalProtein = Number(totalProtein.toFixed(1));
        totalCarbs = Number(totalCarbs.toFixed(1));
        totalFat = Number(totalFat.toFixed(1));

        const perServingProtein = Number(
          (totalProtein / meal.servings).toFixed(1),
        );
        const perServingCarbs = Number((totalCarbs / meal.servings).toFixed(1));
        const perServingFat = Number((totalFat / meal.servings).toFixed(1));
        const perServingCalories = Number(
          (
            perServingProtein * 4 +
            perServingCarbs * 4 +
            perServingFat * 9
          ).toFixed(0),
        );

        return {
          ...meal,
          items: responseItems,
          total: {
            protein: totalProtein,
            carbs: totalCarbs,
            fat: totalFat,
            calories: totalCalories,
          },
          perServing: {
            protein: perServingProtein,
            carbs: perServingCarbs,
            fat: perServingFat,
            calories: perServingCalories,
          },
        };
      });

      return reply.send({
        ok: true,
        meals: responseMeals,
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

  /// GET meal by id

  app.get(
    "/meals/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const user = (request as any).user as JwtPayload;
      const { id } = request.params as { id: string };

      try {
        const result = await db.query(
          `
        SELECT id, user_id, name, description, servings, created_at
        FROM meals
        WHERE user_id = $1 AND id = $2
        `,
          [user.userId, id],
        );

        const meal = result.rows[0];

        if (!meal) {
          return reply.status(404).send({
            ok: false,
            error: "Meal not found",
          });
        }

        const itemsResult = await db.query(
          `
          SELECT
          mp.product_id,
          p.name,
          mp.grams,
          p.protein,
          p.carbs,
          p.fat
          FROM meal_products mp
          JOIN products p ON p.id = mp.product_id
          WHERE mp.meal_id = $1
          `,
          [meal.id],
        );

        const items = itemsResult.rows;

        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalCalories = 0;

        const responseItems = items.map((item) => {
          const protein = Number(
            ((Number(item.protein) * Number(item.grams)) / 100).toFixed(1),
          );
          const carbs = Number(
            ((Number(item.carbs) * Number(item.grams)) / 100).toFixed(1),
          );
          const fat = Number(
            ((Number(item.fat) * Number(item.grams)) / 100).toFixed(1),
          );
          const calories = Number(
            (protein * 4 + carbs * 4 + fat * 9).toFixed(0),
          );

          totalProtein += protein;
          totalCarbs += carbs;
          totalFat += fat;
          totalCalories += calories;

          return {
            productId: item.product_id,
            name: item.name,
            grams: Number(item.grams),
            protein: protein,
            carbs: carbs,
            fat: fat,
            calories: calories,
          };
        });

        const perServingProtein = Number(
          (totalProtein / Number(meal.servings)).toFixed(1),
        );
        const perServingCarbs = Number(
          (totalCarbs / Number(meal.servings)).toFixed(1),
        );
        const perServingFat = Number(
          (totalFat / Number(meal.servings)).toFixed(1),
        );
        const perServingCalories = Number(
          (totalCalories / Number(meal.servings)).toFixed(0),
        );

        return reply.status(200).send({
          ok: true,
          meal: {
            ...meal,
            items: responseItems,
            total: {
              protein: totalProtein,
              carbs: totalCarbs,
              fat: totalFat,
              calories: totalCalories,
            },
            perServing: {
              protein: perServingProtein,
              carbs: perServingCarbs,
              fat: perServingFat,
              calories: perServingCalories,
            },
          },
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
}
