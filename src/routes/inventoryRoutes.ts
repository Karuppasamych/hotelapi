import { Router } from 'express';
import { 
  getAllInventory, 
  getInventoryById,
  addInventoryItem, 
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryByCategory,
  getLowStockItems,
  searchInventoryItems,
  getNextProductCode,
  deductStock
} from '../controllers/inventoryController';

const router = Router();

// Inventory routes
router.get('/next-code', getNextProductCode);
router.get('/', getAllInventory);
router.get('/low-stock', getLowStockItems);
router.get('/search', searchInventoryItems);
router.get('/category/:category', getInventoryByCategory);
router.get('/:id', getInventoryById);
router.post('/', addInventoryItem);
router.post('/:id/deduct', deductStock);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;