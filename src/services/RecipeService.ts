import { Recipe, ScaledRecipe, Ingredient } from '../models/Recipe';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

interface RecipeRow extends RowDataPacket {
  id: string;
  name: string;
  type: 'chicken' | 'mutton' | 'veg';
  base_quantity: number;
  preparation_time: number;
  created_at: Date;
  updated_at: Date;
}

interface IngredientRow extends RowDataPacket {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
}

export class RecipeService {
  
  // Get all recipes from database
  async getAllRecipes(): Promise<Recipe[]> {
    const [rows] = await pool.execute<RecipeRow[]>(`
      SELECT id, name, type, base_quantity, preparation_time, created_at, updated_at 
      FROM recipes
    `);
    
    const recipes: Recipe[] = [];
    
    for (const row of rows) {
      const ingredients = await this.getRecipeIngredients(row.id);
      recipes.push({
        id: row.id,
        name: row.name,
        type: row.type,
        base_quantity: row.base_quantity,
        preparation_time: row.preparation_time,
        ingredients,
        created_at: row.created_at,
        updated_at: row.updated_at
      });
    }
    
    return recipes;
  }

  // Get recipe by ID
  async getRecipeById(id: string): Promise<Recipe | null> {
    const [rows] = await pool.execute<RecipeRow[]>(`
      SELECT id, name, type, base_quantity, preparation_time, created_at, updated_at 
      FROM recipes WHERE id = ?
    `, [id]);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    const ingredients = await this.getRecipeIngredients(id);
    
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      base_quantity: row.base_quantity,
      preparation_time: row.preparation_time,
      ingredients,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  // Get ingredients for a recipe
  private async getRecipeIngredients(recipeId: string): Promise<Ingredient[]> {
    const [rows] = await pool.execute<IngredientRow[]>(`
      SELECT 
        ri.ingredient_id,
        i.name as ingredient_name,
        ri.quantity,
        i.unit,
        i.cost_per_unit
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `, [recipeId]);
    
    return rows.map(row => ({
      id: row.ingredient_id,
      name: row.ingredient_name,
      quantity: row.quantity,
      unit: row.unit,
      cost_per_unit: row.cost_per_unit
    }));
  }

  // Scale recipe ingredients based on target quantity
  async scaleRecipe(recipeId: string, targetQuantity: number): Promise<ScaledRecipe | null> {
    const recipe = await this.getRecipeById(recipeId);
    if (!recipe) return null;

    const scaleFactor = targetQuantity / recipe.base_quantity;
    
    const scaledIngredients: Ingredient[] = recipe.ingredients.map(ingredient => ({
      ...ingredient,
      quantity: ingredient.quantity * scaleFactor
    }));

    const totalCost = scaledIngredients.reduce(
      (sum, ingredient) => sum + (ingredient.quantity * ingredient.cost_per_unit), 
      0
    );

    return {
      ...recipe,
      target_quantity: targetQuantity,
      scaled_ingredients: scaledIngredients,
      total_cost: totalCost
    };
  }
}