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

type CreateMealInput = {
  name: string;
  description?: string;
  servings: number;
  items: {
    productId: string;
    grams: number;
  }[];
};

type CreateMealResponse = {
  ok: true;
  meal: Meal;
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

export async function createMeal(
  token: string,
  input: CreateMealInput,
): Promise<CreateMealResponse> {
  const response = await fetch("http://localhost:3001/meals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create meal");
  }

  return data;
}
