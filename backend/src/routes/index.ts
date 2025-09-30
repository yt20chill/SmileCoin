import { Router } from 'express';
import authRoutes from './authRoutes';
import restaurantRoutes from './restaurantRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Restaurant routes
router.use('/restaurants', restaurantRoutes);

// Other route modules will be imported and used here
// Example:
// import transactionRoutes from './transactions';
// router.use('/transactions', transactionRoutes);

export default router;