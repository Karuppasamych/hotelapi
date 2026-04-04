import { Router } from 'express';
import { createSavedOrder, getAllSavedOrders, deleteSavedOrder } from '../controllers/draftController';

const router = Router();

router.post('/', createSavedOrder);
router.get('/', getAllSavedOrders);
router.delete('/:id', deleteSavedOrder);

export default router;
