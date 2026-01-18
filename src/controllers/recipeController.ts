import { Request, Response } from 'express';
import { RecipeService } from '../services/RecipeService';

const recipeService = new RecipeService();

export const getAllRecipes = async (req: Request, res: Response) => {
  try {
    const recipes = await recipeService.getAllRecipes();
    res.json({ success: true, data: recipes });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recipes' });
  }
};

export const getRecipeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.getRecipeById(id);
    
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }
    
    res.json({ success: true, data: recipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recipe' });
  }
};

export const scaleRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetQuantity } = req.body;
    
    if (!targetQuantity || targetQuantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid target quantity is required' 
      });
    }
    
    const scaledRecipe = await recipeService.scaleRecipe(id, targetQuantity);
    
    if (!scaledRecipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }
    
    res.json({ success: true, data: scaledRecipe });
  } catch (error) {
    console.error('Error scaling recipe:', error);
    res.status(500).json({ success: false, message: 'Failed to scale recipe' });
  }
};