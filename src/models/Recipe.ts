export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string; // kg, grams, liters, pieces, etc.
  cost_per_unit: number;
}

export interface Recipe {
  id: string;
  name: string;
  type: 'chicken' | 'mutton' | 'veg';
  base_quantity: number; // 1kg base
  ingredients: Ingredient[];
  preparation_time: number; // minutes
  created_at: Date;
  updated_at: Date;
}

export interface ScaledRecipe extends Recipe {
  target_quantity: number;
  scaled_ingredients: Ingredient[];
  total_cost: number;
}