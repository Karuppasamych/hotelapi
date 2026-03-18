import { Router } from 'express';
import { createPurchaseItem, getPurchaseListByDate, getAllPurchaseList, deletePurchaseItem } from '../controllers/purchaseListController';

const router = Router();

router.post('/', createPurchaseItem);
router.get('/', getAllPurchaseList);
router.get('/:date', getPurchaseListByDate);
router.delete('/:id', deletePurchaseItem);

export default router;
