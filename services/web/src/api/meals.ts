import { api } from "./client";
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

type GetMealsResponse = {
  ok: true;
  meals: Meal[];
};

export async function getMeals() {
  return api<GetMealsResponse>("/meals");
}
