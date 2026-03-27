type RawMealRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  servings: number | string;
  created_at: string;
};

type RawMealItemRow = {
  meal_id: string;
  product_id: string;
  grams: number | string;
  name: string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
};

type RawProductRow = {
  id: string;
  name: string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
};

export type NormalizedMeal = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  servings: number;
  createdAt: string;
};

export type NormalizedMealItem = {
  mealId: string;
  productId: string;
  grams: number;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
};

export type NormalizedMealProduct = {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
};

export function normalizeMealRow(row: RawMealRow): NormalizedMeal {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    servings: Number(row.servings),
    createdAt: row.created_at,
  };
}

export function normalizeMealItemRow(row: RawMealItemRow): NormalizedMealItem {
  return {
    mealId: row.meal_id,
    productId: row.product_id,
    grams: Number(row.grams),
    name: row.name,
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
  };
}

export function normalizeMealProductRow(
  row: RawProductRow,
): NormalizedMealProduct {
  return {
    id: row.id,
    name: row.name,
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
  };
}
