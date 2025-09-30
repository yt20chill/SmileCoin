import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Other route modules will be imported and used here
// Example:
// import restaurantRoutes from './restaurants';
// import transactionRoutes from './transactions';

// router.use('/restaurants', restaurantRoutes);
// router.use('/transactions', transactionRoutes);

export default router;