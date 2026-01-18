import { Request, Response } from 'express';
import { DailyPreparedService } from '../services/DailyPreparedService';

const dailyPreparedService = new DailyPreparedService();

export const addPreparedBiryani = async (req: Request, res: Response) => {
  try {
    const { recipe_id, quantity_prepared, preparation_cost } = req.body;
    
    if (!recipe_id || !quantity_prepared || !preparation_cost) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID, quantity and cost are required'
      });
    }
    
    const prepared = await dailyPreparedService.addPreparedBiryani({
      recipe_id,
      quantity_prepared: parseFloat(quantity_prepared),
      preparation_cost: parseFloat(preparation_cost)
    });
    
    res.status(201).json({ success: true, data: prepared });
  } catch (error) {
    console.error('Error adding prepared biryani:', error);
    res.status(500).json({ success: false, message: 'Failed to add prepared biryani' });
  }
};

export const getTodaysPrepared = async (req: Request, res: Response) => {
  try {
    const prepared = await dailyPreparedService.getTodaysPrepared();
    res.json({ success: true, data: prepared });
  } catch (error) {
    console.error('Error fetching prepared biryani:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prepared biryani' });
  }
};

export const sellBiryani = async (req: Request, res: Response) => {
  try {
    const { recipe_id, quantity_sold, unit_price } = req.body;
    
    if (!recipe_id || !quantity_sold || !unit_price) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID, quantity sold and unit price are required'
      });
    }
    
    await dailyPreparedService.sellBiryani(
      recipe_id,
      parseFloat(quantity_sold),
      parseFloat(unit_price)
    );
    
    res.json({ success: true, message: 'Sale recorded successfully' });
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to record sale'
    });
  }
};