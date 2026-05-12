import { useEffect, useState } from "react";
import { createMeal, deleteMeal, getMeals, type Meal } from "../api/meals";
import { getProducts, type Product } from "../api/products";

type MealItemForm = {
  productId: string;
  grams: string;
};

export default function MealsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("1");
  const [items, setItems] = useState<MealItemForm[]>([
    { productId: "", grams: "" },
  ]);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingMealId, setDeletingMealId] = useState("");

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
      setError("");
    } catch {
      setError("Failed to load Meals");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadPageData() {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Missing authentication token");
        setIsLoading(false);
        return;
      }

      try {
        const [mealsData, productsData] = await Promise.all([
          getMeals(token),
          getProducts(token),
        ]);
        setMeals(mealsData.meals);
        setProducts(productsData.products);
        setError("");
      } catch {
        setError("Failed to load page data");
      } finally {
        setIsLoading(false);
      }
    }

    loadPageData();
  }, []);

  function updateItem(index: number, field: keyof MealItemForm, value: string) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItemRow() {
    setItems((currentItems) => [...currentItems, { productId: "", grams: "" }]);
  }

  function removeItemRow(index: number) {
    setItems((currentItems) =>
      currentItems.length === 1
        ? currentItems
        : currentItems.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setFormError("Missing authentication token");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      const filteredItems = items
        .filter((item) => item.productId && item.grams)
        .map((item) => ({
          productId: item.productId,
          grams: Number(item.grams),
        }));

      if (filteredItems.length === 0) {
        throw new Error("Add at least one meal item");
      }

      await createMeal(token, {
        name: name.trim(),
        description: description.trim() || undefined,
        servings: Number(servings),
        items: filteredItems,
      });

      setName("");
      setDescription("");
      setServings("1");
      setItems([{ productId: "", grams: "" }]);

      await loadMeals();
    } catch (submitError) {
      if (submitError instanceof Error) {
        setFormError(submitError.message);
      } else {
        setFormError("Failed to create meal");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(mealId: string) {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Missing authentication token");
      return;
    }

    setDeletingMealId(mealId);
    setError("");

    try {
      await deleteMeal(token, mealId);
      await loadMeals();
    } catch (deleteError) {
      if (deleteError instanceof Error) {
        setError(deleteError.message);
      } else {
        setError("Failed to delete meal");
      }
    } finally {
      setDeletingMealId("");
    }
  }

  if (isLoading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-white">{error}</div>;

  return (
    <div className="text-white">
      <h1 className="pb-4 text-2xl">Meals</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-lg border border-zinc-700 bg-zinc-900 p-4"
      >
        <h2 className="mb-4 text-lg font-semibold">Add meal</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-zinc-300">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-zinc-300">Servings</span>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-sm text-zinc-300">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Items</h3>
            <button
              type="button"
              onClick={addItemRow}
              className="cursor-pointer rounded-md border border-zinc-700 px-3 py-2 text-sm"
            >
              Add item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={`${index}-${item.productId}`}
                className="grid grid-cols-1 gap-3 rounded-md border border-zinc-800 p-3 md:grid-cols-[1fr_140px_auto]"
              >
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-zinc-300">Product</span>
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      updateItem(index, "productId", e.target.value)
                    }
                    className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm text-zinc-300">Grams</span>
                  <input
                    type="number"
                    min="0.1"
                    max="9999.9"
                    step="0.1"
                    value={item.grams}
                    onChange={(e) => updateItem(index, "grams", e.target.value)}
                    className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
                    required
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    disabled={items.length === 1}
                    className="w-full cursor-pointer rounded-md border border-zinc-700 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {formError ? (
          <p className="mt-4 text-sm text-red-400">{formError}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || products.length === 0}
          className="mt-4 cursor-pointer rounded-md bg-white px-4 py-2 font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create meal"}
        </button>
      </form>

      {products.length === 0 ? (
        <div className="mb-6 rounded-lg border border-amber-700 bg-amber-950/40 p-4 text-amber-200">
          Create at least one product before building a meal.
        </div>
      ) : null}

      {meals.length === 0 ? <div className="text-white">No meals</div> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="p-4 border rounded-lg bg-zinc-900 border-zinc-700"
          >
            <div className="flex items-start justify-between gap-4">
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

              <button
                type="button"
                onClick={() => handleDelete(meal.id)}
                disabled={deletingMealId === meal.id}
                className="cursor-pointer rounded-md border border-red-700 px-3 py-2 text-sm text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingMealId === meal.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
