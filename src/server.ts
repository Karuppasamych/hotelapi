import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { connectDB } from './config/database';
import authRoutes from './routes/authRoutes';
import recipeRoutes from './routes/recipeRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import salesRoutes from './routes/salesRoutes';
import preparedRoutes from './routes/preparedRoutes';
import cuisineRoutes from './routes/cuisineRoutes';
import confirmedMenuRoutes from './routes/confirmedMenuRoutes';
import purchaseListRoutes from './routes/purchaseListRoutes';
import billingRoutes from './routes/billingRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Initialize database connection
connectDB();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/prepared', preparedRoutes);
app.use('/api/cuisines', cuisineRoutes);
app.use('/api/confirmed-menus', confirmedMenuRoutes);
app.use('/api/purchase-list', purchaseListRoutes);
app.use('/api/billing', billingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});

export default app;