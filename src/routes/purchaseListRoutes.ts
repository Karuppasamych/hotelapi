import { Router } from 'express';
import { createPurchaseItem, getPurchaseListByDate, getAllPurchaseList, deletePurchaseItem, updatePurchaseStatus, updatePurchaseItem } from '../controllers/purchaseListController';

const router = Router();

router.post('/', createPurchaseItem);
router.put('/status', updatePurchaseStatus);
router.put('/:id', updatePurchaseItem);
router.get('/', getAllPurchaseList);
router.get('/:date', getPurchaseListByDate);
router.delete('/:id', deletePurchaseItem);

export default router;
