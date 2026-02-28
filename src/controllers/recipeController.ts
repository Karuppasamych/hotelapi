import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getAllRecipes = async (req: Request, res: Response) => {
  try {
    const [recipes] = await pool.query<RowDataPacket[]>(`
      SELECT r.*, c.cuisine_name as cuisine 
      FROM recipes r 
      LEFT JOIN cuisines c ON r.cuisine_id = c.id 
      ORDER BY r.created_at DESC
    `);
    
    // Fetch ingredients and instructions for each recipe
    for (const recipe of recipes) {
      const [ingredients] = await pool.query<RowDataPacket[]>(
        'SELECT ingredient_name as name, quantity, unit FROM recipe_ingredients WHERE recipe_id = ?',
        [recipe.id]
      );
      const [instructions] = await pool.query<RowDataPacket[]>(
        'SELECT instruction FROM recipe_instructions WHERE recipe_id = ? ORDER BY step_number',
        [recipe.id]
      );
      recipe.ingredients = ingredients;
      recipe.instructions = instructions.map((i: any) => i.instruction);
    }
    
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recipes', error });
  }
};

export const getRecipeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [recipes] = await pool.query<RowDataPacket[]>(
      'SELECT r.*, c.cuisine_name as cuisine FROM recipes r LEFT JOIN cuisines c ON r.cuisine_id = c.id WHERE r.id = ?',
      [id]
    );
    
    if (recipes.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    const recipe = recipes[0];
    const [ingredients] = await pool.query<RowDataPacket[]>(
      'SELECT ingredient_name as name, quantity, unit FROM recipe_ingredients WHERE recipe_id = ?',
      [id]
    );
    const [instructions] = await pool.query<RowDataPacket[]>(
      'SELECT instruction FROM recipe_instructions WHERE recipe_id = ? ORDER BY step_number',
      [id]
    );
    
    recipe.ingredients = ingredients;
    recipe.instructions = instructions.map((i: any) => i.instruction);
    
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recipe', error });
  }
};

export const createRecipe = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { name, category, cuisine_id, description, prep_time, cook_time, servings, difficulty, ingredients, instructions } = req.body;
    
    // Insert recipe
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO recipes (name, category, cuisine_id, description, prep_time, cook_time, servings, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, category, cuisine_id, description, prep_time, cook_time, servings, difficulty]
    );
    
    const recipeId = result.insertId;
    
    // Insert ingredients
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        await connection.query(
          'INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES (?, ?, ?, ?)',
          [recipeId, ing.name, ing.quantity, ing.unit || '']
        );
      }
    }
    
    // Insert instructions
    if (instructions && instructions.length > 0) {
      for (let i = 0; i < instructions.length; i++) {
        await connection.query(
          'INSERT INTO recipe_instructions (recipe_id, step_number, instruction) VALUES (?, ?, ?)',
          [recipeId, i + 1, instructions[i]]
        );
      }
    }
    
    await connection.commit();
    res.status(201).json({ id: recipeId, message: 'Recipe created successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Error creating recipe', error });
  } finally {
    connection.release();
  }
};

export const updateRecipe = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { name, category, cuisine_id, description, prep_time, cook_time, servings, difficulty, ingredients, instructions } = req.body;
    
    // Update recipe
    await connection.query(
      'UPDATE recipes SET name = ?, category = ?, cuisine_id = ?, description = ?, prep_time = ?, cook_time = ?, servings = ?, difficulty = ? WHERE id = ?',
      [name, category, cuisine_id, description, prep_time, cook_time, servings, difficulty, id]
    );
    
    // Delete old ingredients and instructions
    await connection.query('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [id]);
    await connection.query('DELETE FROM recipe_instructions WHERE recipe_id = ?', [id]);
    
    // Insert new ingredients
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        await connection.query(
          'INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES (?, ?, ?, ?)',
          [id, ing.name, ing.quantity, ing.unit || '']
        );
      }
    }
    
    // Insert new instructions
    if (instructions && instructions.length > 0) {
      for (let i = 0; i < instructions.length; i++) {
        await connection.query(
          'INSERT INTO recipe_instructions (recipe_id, step_number, instruction) VALUES (?, ?, ?)',
          [id, i + 1, instructions[i]]
        );
      }
    }
    
    await connection.commit();
    res.json({ message: 'Recipe updated successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Error updating recipe', error });
  } finally {
    connection.release();
  }
};

export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM recipes WHERE id = ?', [id]);
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting recipe', error });
  }
};
