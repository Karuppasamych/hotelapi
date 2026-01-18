import { Router } from 'express';
import { 
  getAllInventory, 
  getInventoryById,
  addInventoryItem, 
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryByCategory,
  getLowStockItems,
  searchInventoryItems
} from '../controllers/inventoryController';

const router = Router();

// Inventory routes
router.get('/', getAllInventory);
router.get('/low-stock', getLowStockItems);
router.get('/search', searchInventoryItems);
router.get('/category/:category', getInventoryByCategory);
router.get('/:id', getInventoryById);
router.post('/', addInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;