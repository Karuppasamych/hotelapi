import { Router } from 'express';
import { login, register, getProfile, getAllUsers, updateUser, deleteUser } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/profile', authenticateToken, getProfile);

export default router;
