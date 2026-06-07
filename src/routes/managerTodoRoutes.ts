import { Router } from 'express';
import { addFromConfirmedMenu, getByDate, getConsolidatedByDate, deductOnBillPaid, moveToInventory, bulkMoveToInventory, bulkMoveSelectedToInventory, updateTotalQuantity, deleteTodoItem } from '../controllers/managerTodoController';

const router = Router();

router.post('/', addFromConfirmedMenu);
router.post('/deduct', deductOnBillPaid);
router.post('/bulk-move', bulkMoveToInventory);
router.post('/bulk-move-selected', bulkMoveSelectedToInventory);
router.get('/date/:date', getByDate);
router.get('/consolidated/:date', getConsolidatedByDate);
router.put('/move/:id', moveToInventory);
router.put('/update-total/:id', updateTotalQuantity);
router.delete('/:id', deleteTodoItem);

export default router;
