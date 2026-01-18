export interface DailyPreparedBiryani {
  id: number;
  recipe_id: string;
  quantity_prepared: number;
  preparation_cost: number;
  prepared_date: string;
  prepared_time: Date;
  status: 'prepared' | 'partially_sold' | 'sold_out';
  remaining_quantity: number;
}

export interface PreparedBiryaniRequest {
  recipe_id: string;
  quantity_prepared: number;
  preparation_cost: number;
}