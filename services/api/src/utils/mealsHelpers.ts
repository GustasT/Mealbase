import { NormalizedMeal, NormalizedMealItem } from "./mealsNormalization";

export type MealResponseItem = {
  productId: string;
  name: string;
  grams: number;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

export type MealTotals = {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

export function buildResponseItemsAndTotals(items: NormalizedMealItem[]) {
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalCalories = 0;

  const responseItems: MealResponseItem[] = items.map((item) => {
    const protein = Number(((item.protein * item.grams) / 100).toFixed(1));
    const carbs = Number(((item.carbs * item.grams) / 100).toFixed(1));
    const fat = Number(((item.fat * item.grams) / 100).toFixed(1));
    const calories = Number((protein * 4 + carbs * 4 + fat * 9).toFixed(0));

    totalProtein += protein;
    totalCarbs += carbs;
    totalFat += fat;
    totalCalories += calories;

    return {
      productId: item.productId,
      name: item.name,
      grams: item.grams,
      protein,
      carbs,
      fat,
      calories,
    };
  });

  const totals: MealTotals = {
    protein: Number(totalProtein.toFixed(1)),
    carbs: Number(totalCarbs.toFixed(1)),
    fat: Number(totalFat.toFixed(1)),
    calories: totalCalories,
  };

  return {
    responseItems,
    totals,
  };
}

export function buildMealResponse(
  meal: NormalizedMeal,
  responseItems: MealResponseItem[],
  totals: MealTotals,
) {
  const perServing = {
    protein: Number((totals.protein / meal.servings).toFixed(1)),
    carbs: Number((totals.carbs / meal.servings).toFixed(1)),
    fat: Number((totals.fat / meal.servings).toFixed(1)),
    calories: Number((totals.calories / meal.servings).toFixed(0)),
  };

  return {
    ...meal,
    items: responseItems,
    total: totals,
    perServing,
  };
}
