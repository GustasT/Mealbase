import { useEffect, useState } from "react";
import { getMeals, type Meal } from "../api/meals";

export default function MealsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    async function loadMeals() {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Missing authentication token");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getMeals(token);
        setMeals(data.meals);
      } catch {
        setError("Failed to load Meals");
      } finally {
        setIsLoading(false);
      }
      // console.log(data);
    }
    loadMeals();
  }, []);

  if (isLoading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-white">{error}</div>;
  if (meals.length === 0) return <div className="text-white">No meals</div>;

  return (
    <div className="text-white">
      <h1 className="text-2xl pb-2">Meals</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="p-4 border rounded-lg bg-zinc-900 border-zinc-700"
          >
            <div>
              <p className="font-bold">{meal.name}</p>
              <p>servings: {meal.servings}</p>
              <p>protein: {meal.perServing.protein}</p>
              <p>carbs: {meal.perServing.carbs}</p>
              <p>fat: {meal.perServing.fat}</p>
              <p>calories: {meal.perServing.calories}</p>
              <p className="text-sm text-gray-600">
                created at: {meal.createdAt}
              </p>
              {meal.items.map((item) => (
                <div key={item.productId}>
                  <p>
                    {item.grams}g {item.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
