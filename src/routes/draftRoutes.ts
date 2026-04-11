import { Router } from 'express';
import { createSavedOrder, getAllSavedOrders, deleteSavedOrder, updateSavedOrder } from '../controllers/draftController';

const router = Router();

router.post('/', createSavedOrder);
router.get('/', getAllSavedOrders);
router.put('/:id', updateSavedOrder);
router.delete('/:id', deleteSavedOrder);

export default router;
