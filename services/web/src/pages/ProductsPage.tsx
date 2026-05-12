import { useEffect, useState } from "react";
import { createProduct, getProducts, type Product } from "../api/products";

export default function ProductsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadProducts() {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Missing authentication token");
      setIsLoading(false);
      return;
    }

    try {
      const data = await getProducts(token);
      setProducts(data.products);
      setError("");
    } catch {
      setError("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setFormError("Missing authentication token");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await createProduct(token, {
        name: name.trim(),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
      });

      setName("");
      setProtein("");
      setCarbs("");
      setFat("");

      await loadProducts();
    } catch (submitError) {
      if (submitError instanceof Error) {
        setFormError(submitError.message);
      } else {
        setFormError("Failed to create product");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-white">{error}</div>;

  return (
    <div className="text-white">
      <h1 className="pb-4 text-2xl">Products</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-lg border border-zinc-700 bg-zinc-900 p-4"
      >
        <h2 className="mb-4 text-lg font-semibold">Add product</h2>

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
            <span className="text-sm text-zinc-300">Protein</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-zinc-300">Carbs</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-zinc-300">Fat</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2"
              required
            />
          </label>
        </div>

        {formError ? (
          <p className="mt-4 text-sm text-red-400">{formError}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 rounded-md bg-white px-4 py-2 font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create product"}
        </button>
      </form>

      {products.length === 0 ? (
        <div className="text-white">No products</div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="p-4 border rounded-lg bg-zinc-900 border-zinc-700"
          >
            <div>
              <p className="font-bold">{product.name}</p>
              <p>protein: {product.protein}</p>
              <p>carbs: {product.carbs}</p>
              <p>fat: {product.fat}</p>
              <p>calories: {product.calories}</p>
              <p className="text-sm text-gray-600">
                created at: {product.createdAt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
