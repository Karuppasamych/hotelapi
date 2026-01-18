import { Request, Response } from 'express';
import { RawMaterialService } from '../services/RawMaterialService';

const rawMaterialService = new RawMaterialService();

export class RawMaterialController {
  // GET /api/inventory
  getAllItems = (req: Request, res: Response) => {
    try {
      const items = rawMaterialService.getAllItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inventory items' });
    }
  };

  // GET /api/inventory/:id
  getItemById = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = rawMaterialService.getItemById(id);
      
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch item' });
    }
  };

  // POST /api/inventory
  createItem = (req: Request, res: Response) => {
    try {
      const newItem = rawMaterialService.addItem(req.body);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create item' });
    }
  };

  // PUT /api/inventory/:id
  updateItem = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedItem = rawMaterialService.updateItem(id, req.body);
      
      if (!updatedItem) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update item' });
    }
  };

  // DELETE /api/inventory/:id
  deleteItem = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = rawMaterialService.deleteItem(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Item not found' });
      }
      
      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  };

  // GET /api/inventory/category/:category
  getItemsByCategory = (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const items = rawMaterialService.getItemsByCategory(category);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch items by category' });
    }
  };

  // GET /api/inventory/low-stock
  getLowStockItems = (req: Request, res: Response) => {
    try {
      const items = rawMaterialService.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
  };

  // GET /api/inventory/search?q=query
  searchItems = (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const items = rawMaterialService.searchItems(q);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search items' });
    }
  };
}