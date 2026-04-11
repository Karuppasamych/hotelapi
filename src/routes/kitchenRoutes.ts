import { Router } from 'express';
import {
  createKitchenOrder,
  getAllKitchenOrders,
  getTodayKitchenOrders,
  updateKitchenOrderStatus,
  deleteKitchenOrder,
  reduceItemQuantity
} from '../controllers/kitchenController';

const router = Router();

router.post('/', createKitchenOrder);
router.put('/reduce-item', reduceItemQuantity);
router.get('/', getAllKitchenOrders);
router.get('/today', getTodayKitchenOrders);
router.put('/:id/status', updateKitchenOrderStatus);
router.delete('/:id', deleteKitchenOrder);

export default router;
