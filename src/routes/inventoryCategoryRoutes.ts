import { Router } from 'express';
import { getAllCategories, createCategory, deleteCategory } from '../controllers/inventoryCategoryController';

const router = Router();

router.get('/', getAllCategories);
router.post('/', createCategory);
router.delete('/:id', deleteCategory);

export default router;
