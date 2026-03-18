import express from 'express';
import { createBill, getAllBills, getBillById, getBillsByDate } from '../controllers/billingController';

const router = express.Router();

router.post('/', createBill);
router.get('/', getAllBills);
router.get('/date/:date', getBillsByDate);
router.get('/:id', getBillById);

export default router;
