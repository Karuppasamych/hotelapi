import { Router } from 'express';
import {
  createConfirmedMenu,
  getAllConfirmedMenus,
  getConfirmedMenuByDate,
  updateConfirmedMenu,
  deleteConfirmedMenu
} from '../controllers/confirmedMenuController';

const router = Router();

router.post('/', createConfirmedMenu);
router.get('/', getAllConfirmedMenus);
router.get('/:date', getConfirmedMenuByDate);
router.put('/:id', updateConfirmedMenu);
router.delete('/:id', deleteConfirmedMenu);

export default router;
