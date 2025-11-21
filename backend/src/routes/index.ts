import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import groupRoutes from './group.routes';
import expenseRoutes from './expense.routes';
import settlementRoutes from './settlement.routes';
import { expenseController } from '../controllers/expense.controller';
import { settlementController } from '../controllers/settlement.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Mount main routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/expenses', expenseRoutes);
router.use('/settlements', settlementRoutes);

// Nested group routes for expenses
router.get('/groups/:groupId/expenses', authenticate, expenseController.getGroupExpenses.bind(expenseController));
router.get('/groups/:groupId/expenses/statistics', authenticate, expenseController.getGroupExpenseStatistics.bind(expenseController));

// Nested group routes for settlements
router.get('/groups/:groupId/settlements', authenticate, settlementController.getGroupSettlements.bind(settlementController));
router.get('/groups/:groupId/settlements/suggestions', authenticate, settlementController.calculateSuggestedSettlements.bind(settlementController));

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
