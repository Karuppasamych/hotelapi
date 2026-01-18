import { Router } from 'express';
import { RawMaterialController } from '../controllers/RawMaterialController';

const router = Router();
const controller = new RawMaterialController();

// Raw materials inventory routes
router.get('/inventory', controller.getAllItems);
router.get('/inventory/low-stock', controller.getLowStockItems);
router.get('/inventory/search', controller.searchItems);
router.get('/inventory/category/:category', controller.getItemsByCategory);
router.get('/inventory/:id', controller.getItemById);
router.post('/inventory', controller.createItem);
router.put('/inventory/:id', controller.updateItem);
router.delete('/inventory/:id', controller.deleteItem);

export default router;