import { Router } from 'express';
import { 
  getAllRecipes, 
  getRecipeById, 
  scaleRecipe
} from '../controllers/recipeController';

const router = Router();

router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);
router.post('/:id/scale', scaleRecipe);

export default router;