import express from 'express';
import { createBill, getAllBills, getBillById, getBillsByDate, getSoldCountsByDate, createCancellation, getAllCancellations } from '../controllers/billingController';

const router = express.Router();

router.post('/', createBill);
router.post('/cancellations', createCancellation);
router.get('/cancellations', getAllCancellations);
router.get('/', getAllBills);
router.get('/date/:date', getBillsByDate);
router.get('/sold/:date', getSoldCountsByDate);
router.get('/:id', getBillById);

export default router;
