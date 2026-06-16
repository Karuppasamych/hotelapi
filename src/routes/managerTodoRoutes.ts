import { Router } from 'express';
import { addFromConfirmedMenu, getByDate, getConsolidatedByDate, deductOnBillPaid, moveToInventory, bulkMoveToInventory, bulkMoveSelectedToInventory, bulkMoveFromInventory, updateTotalQuantity, updateReducedFromInventory, deleteTodoItem } from '../controllers/managerTodoController';

const router = Router();

router.post('/', addFromConfirmedMenu);
router.post('/deduct', deductOnBillPaid);
router.post('/bulk-move', bulkMoveToInventory);
router.post('/bulk-move-selected', bulkMoveSelectedToInventory);
router.post('/bulk-move-from-inventory', bulkMoveFromInventory);
router.get('/date/:date', getByDate);
router.get('/consolidated/:date', getConsolidatedByDate);
router.put('/move/:id', moveToInventory);
router.put('/update-total/:id', updateTotalQuantity);
router.put('/update-reduced/:id', updateReducedFromInventory);
router.delete('/:id', deleteTodoItem);

export default router;
