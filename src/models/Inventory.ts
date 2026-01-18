export interface InventoryItem {
  id: number;
  product_code: string;
  name: string;
  unit: string;
  price: number;
  quantity_available: number;
  price_per_unit: number;
  category: string;
  minimum_stock: number;
}

export interface StockUpdate {
  recipe_id: string;
  quantity_sold: number;
  sale_price: number;
  timestamp: Date;
}