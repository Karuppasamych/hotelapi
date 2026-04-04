import { Router } from 'express';
import {
  createConfirmedMenu,
  getAllConfirmedMenus,
  getConfirmedMenuByDate,
  updateConfirmedMenu,
  deleteConfirmedMenu,
  updateConfirmedMenuStatus,
  reduceServings
} from '../controllers/confirmedMenuController';

const router = Router();

router.post('/', createConfirmedMenu);
router.put('/reduce-servings', reduceServings);
router.get('/', getAllConfirmedMenus);
router.get('/:date', getConfirmedMenuByDate);
router.put('/:id', updateConfirmedMenu);
router.put('/:id/status', updateConfirmedMenuStatus);
router.delete('/:id', deleteConfirmedMenu);

export default router;
