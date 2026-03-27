type RawProductRow = {
  id: string;
  user_id: string;
  name: string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  created_at: string;
};

export type NormalizedProduct = {
  id: string;
  userId: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
};

export function normalizeProductRow(row: RawProductRow): NormalizedProduct {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    createdAt: row.created_at,
  };
}
