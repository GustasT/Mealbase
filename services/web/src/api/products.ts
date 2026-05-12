export type Product = {
  id: string;
  userId: string;
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

type CreateProductInput = {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
};

type CreateProductResponse = {
  ok: true;
  product: Product;
};

type DeleteProductResponse = {
  ok: true;
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

export async function createProduct(
  token: string,
  input: CreateProductInput,
): Promise<CreateProductResponse> {
  const response = await fetch("http://localhost:3001/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create product");
  }

  return data;
}

export async function deleteProduct(
  token: string,
  productId: string,
): Promise<DeleteProductResponse> {
  const response = await fetch(`http://localhost:3001/products/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete product");
  }

  return data;
}
