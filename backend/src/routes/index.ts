import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import groupRoutes from './group.routes';
import expenseRoutes from './expense.routes';
import settlementRoutes from './settlement.routes';
import receiptRoutes from './receipt.routes';
import notificationRoutes from './notification.routes';
import analyticsRoutes from './analytics.routes';
import { expenseController } from '../controllers/expense.controller';
import { settlementController } from '../controllers/settlement.controller';
import { receiptController } from '../controllers/receipt.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Mount main routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/expenses', expenseRoutes);
router.use('/settlements', settlementRoutes);
router.use('/receipts', receiptRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

// Nested group routes for expenses
router.get(
  '/groups/:groupId/expenses',
  authenticate,
  expenseController.getGroupExpenses.bind(expenseController)
);
router.get(
  '/groups/:groupId/expenses/statistics',
  authenticate,
  expenseController.getGroupExpenseStatistics.bind(expenseController)
);

// Nested group routes for settlements
router.get(
  '/groups/:groupId/settlements',
  authenticate,
  settlementController.getGroupSettlements.bind(settlementController)
);
router.get(
  '/groups/:groupId/settlements/suggestions',
  authenticate,
  settlementController.calculateSuggestedSettlements.bind(settlementController)
);

// Nested route for expense receipts
router.get(
  '/expenses/:expenseId/receipts',
  authenticate,
  receiptController.getExpenseReceipts.bind(receiptController)
);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
