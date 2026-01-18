export interface Sale {
  id: string;
  recipe_id: string;
  recipe_name: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  sale_date: Date;
  customer_info?: string;
}

export interface DailySalesReport {
  date: string;
  total_sales: number;
  total_revenue: number;
  sales_by_recipe: {
    recipe_name: string;
    quantity_sold: number;
    revenue: number;
  }[];
}