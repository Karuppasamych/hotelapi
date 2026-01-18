import { InventoryItem } from '../models/Inventory';

// Raw materials inventory interface matching frontend
export interface RawMaterialItem {
  id: string;
  product_code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  minimum_stock: number;
}

export class RawMaterialService {
  private inventory: RawMaterialItem[] = [
    {
      id: '1',
      product_code: 'MPH001',
      name: 'Tomatoes',
      category: 'Vegetables',
      quantity: 25.00,
      unit: 'kg',
      price: 3.50,
      minimum_stock: 10.00,
    },
    {
      id: '2',
      product_code: 'MPH002',
      name: 'Rice',
      category: 'Grains',
      quantity: 50.00,
      unit: 'kg',
      price: 2.20,
      minimum_stock: 20.00,
    },
    // Add more initial data as needed
  ];

  // Get all raw materials
  getAllItems(): RawMaterialItem[] {
    return this.inventory;
  }

  // Get item by ID
  getItemById(id: string): RawMaterialItem | undefined {
    return this.inventory.find(item => item.id === id);
  }

  // Add new item
  addItem(item: Omit<RawMaterialItem, 'id'>): RawMaterialItem {
    const newItem: RawMaterialItem = {
      ...item,
      id: Date.now().toString()
    };
    this.inventory.push(newItem);
    return newItem;
  }

  // Update item
  updateItem(id: string, updates: Partial<RawMaterialItem>): RawMaterialItem | null {
    const index = this.inventory.findIndex(item => item.id === id);
    if (index === -1) return null;

    this.inventory[index] = { ...this.inventory[index], ...updates };
    return this.inventory[index];
  }

  // Delete item
  deleteItem(id: string): boolean {
    const index = this.inventory.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.inventory.splice(index, 1);
    return true;
  }

  // Get items by category
  getItemsByCategory(category: string): RawMaterialItem[] {
    return this.inventory.filter(item => item.category === category);
  }

  // Get low stock items
  getLowStockItems(): RawMaterialItem[] {
    return this.inventory.filter(item => item.quantity <= item.minimum_stock);
  }

  // Search items
  searchItems(query: string): RawMaterialItem[] {
    const searchTerm = query.toLowerCase();
    return this.inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.product_code.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    );
  }
}