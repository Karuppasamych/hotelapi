import { Router } from 'express';
import { 
  addPreparedBiryani,
  getTodaysPrepared,
  sellBiryani
} from '../controllers/preparedController';

const router = Router();

router.post('/add', addPreparedBiryani);
router.get('/today', getTodaysPrepared);
router.post('/sell', sellBiryani);

export default router;