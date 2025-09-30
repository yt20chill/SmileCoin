import { Router } from 'express';
import authRoutes from './authRoutes';
import rankingRoutes from './rankingRoutes';
import restaurantRoutes from './restaurantRoutes';
import transactionRoutes from './transactionRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Restaurant routes
router.use('/restaurants', restaurantRoutes);

// Ranking routes
router.use('/rankings', rankingRoutes);

// Transaction routes
router.use('/transactions', transactionRoutes);

export default router;