import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/analytics/overview
 * @desc    Get user's overall analytics overview
 * @access  Private
 */
router.get('/overview', authenticate, analyticsController.getOverview.bind(analyticsController));

/**
 * @route   GET /api/v1/analytics/receipts
 * @desc    Get detailed receipt analytics
 * @access  Private
 */
router.get('/receipts', authenticate, analyticsController.getReceiptAnalytics.bind(analyticsController));

/**
 * @route   GET /api/v1/analytics/expenses
 * @desc    Get detailed expense analytics
 * @access  Private
 */
router.get('/expenses', authenticate, analyticsController.getExpenseAnalytics.bind(analyticsController));

/**
 * @route   GET /api/v1/analytics/trends
 * @desc    Get spending trends over time
 * @access  Private
 */
router.get('/trends', authenticate, analyticsController.getSpendingTrends.bind(analyticsController));

export default router;
