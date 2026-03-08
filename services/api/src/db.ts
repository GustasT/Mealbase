import { Pool } from "pg";

export const db = new Pool({
  host: "mealbase-db",
  port: 5432,
  user: "mealbase",
  password: "mealbase",
  database: "mealbase",
});
