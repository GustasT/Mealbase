export type Meal = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  servings: number;
  createdAt: string;
  items: {
    productId: string;
    name: string;
    grams: number;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  }[];
  total: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
  perServing: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
};

type MealsResponse = {
  ok: true;
  meals: Meal[];
};

export async function getMeals(token: string): Promise<MealsResponse> {
  const response = await fetch("http://localhost:3001/meals", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Meals not found");
  }

  return data;
}
