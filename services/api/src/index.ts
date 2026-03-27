import Fastify from "fastify";
import { db } from "./db";
import { profileRoute } from "./routes/profile";
import { authRoute } from "./routes/auth";
import { productsRoute } from "./routes/products";
import { mealsRoute } from "./routes/meals";

const app = Fastify();
const JWT_SECRET = process.env.JWT_SECRET!;

app.get("/health", async () => {
  try {
    await db.query("SELECT 1");
    return { ok: true, db: true };
  } catch {
    return { ok: true, db: false };
  }
});

authRoute(app);

profileRoute(app);

productsRoute(app);

mealsRoute(app);

const start = async () => {
  try {
    await db.query("SELECT 1");
    await app.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Server running on port 3001");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
