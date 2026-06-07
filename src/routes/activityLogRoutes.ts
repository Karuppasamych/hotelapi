import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLogController';

const router = Router();

router.get('/', getActivityLogs);

export default router;
