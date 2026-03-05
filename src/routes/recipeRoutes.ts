import express from 'express';
import { getAllRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe, getRecipesForCalculator } from '../controllers/recipeController';

const router = express.Router();

router.get('/calculator', getRecipesForCalculator);
router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);
router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;
