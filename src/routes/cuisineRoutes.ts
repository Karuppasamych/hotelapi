import express from 'express';
import { getAllCuisines, addCuisine, updateCuisine, deleteCuisine } from '../controllers/cuisineController';

const router = express.Router();

router.get('/', getAllCuisines);
router.post('/', addCuisine);
router.put('/:id', updateCuisine);
router.delete('/:id', deleteCuisine);

export default router;
