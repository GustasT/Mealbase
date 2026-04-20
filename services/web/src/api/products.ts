export type Product = {
  id: string;
  iserId: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
  calories: number;
};

type ProductsResponse = {
  ok: true;
  products: Product[];
};

export async function getProducts(token: string): Promise<ProductsResponse> {
  const response = await fetch("http://localhost:3001/products", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Products not found");
  }

  return data;
}
