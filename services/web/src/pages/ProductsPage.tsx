import { useEffect, useState } from "react";
import { getProducts, type Product } from "../api/products";

export default function ProductsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
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
      } catch {
        setError("Failed to load products");
      } finally {
        setIsLoading(false);
      }
      // console.log(data);
    }
    loadProducts();
  }, []);

  if (isLoading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-white">{error}</div>;
  if (products.length === 0)
    return <div className="text-white">No products</div>;

  return (
    <div className="text-white">
      <h1 className="text-2xl pb-2">Products</h1>

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
