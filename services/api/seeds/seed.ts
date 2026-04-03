import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();

  const seedUserEmail = "test@example.com";
  const seedUserPassword = "test1234";

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM meal_products");
    await client.query("DELETE FROM meals");
    await client.query("DELETE FROM products");
    await client.query("DELETE FROM users");

    const userId = randomUUID();
    const chickenId = randomUUID();
    const riceId = randomUUID();
    const avocadoId = randomUUID();
    const mealId = randomUUID();

    const passwordHash = await bcrypt.hash(seedUserPassword, 10);

    await client.query(
      `
      INSERT INTO users (id, email, password_hash)
      VALUES ($1, $2, $3)
      `,
      [userId, seedUserEmail, passwordHash],
    );

    await client.query(
      `
      INSERT INTO products (id, user_id, name, protein, carbs, fat)
      VALUES
        ($1, $2, $3, $4, $5, $6),
        ($7, $2, $8, $9, $10, $11),
        ($12, $2, $13, $14, $15, $16)
      `,
      [
        chickenId,
        userId,
        "Chicken Breast",
        31.0,
        0.0,
        3.6,

        riceId,
        "Rice",
        2.7,
        28.0,
        0.3,

        avocadoId,
        "Avocado",
        2.0,
        9.0,
        15.0,
      ],
    );

    await client.query(
      `
      INSERT INTO meals (id, user_id, name, description, servings)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [mealId, userId, "Chicken Rice Bowl", "Seeded demo meal", 3],
    );

    const mealItems = [
      { productId: chickenId, grams: 500.0 },
      { productId: riceId, grams: 375.0 },
      { productId: avocadoId, grams: 30.0 },
    ];

    for (const item of mealItems) {
      await client.query(
        `
        INSERT INTO meal_products (id, meal_id, product_id, grams)
        VALUES ($1, $2, $3, $4)
        `,
        [randomUUID(), mealId, item.productId, item.grams],
      );
    }

    await client.query("COMMIT");

    console.log("✅ Seed complete");
    console.log(`Seeded user email: ${seedUserEmail}`);
    console.log(`Seeded user password: ${seedUserPassword}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
