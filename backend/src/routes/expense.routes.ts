import { Router } from 'express';
import { expenseController } from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createExpenseSchema, updateExpenseSchema } from '../types/validation';

const router = Router();

/**
 * @route   GET /api/v1/expenses
 * @desc    Get user's expenses across all groups
 * @access  Private
 */
router.get('/', authenticate, expenseController.getUserExpenses.bind(expenseController));

/**
 * @route   POST /api/v1/expenses
 * @desc    Create a new expense
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(createExpenseSchema),
  expenseController.createExpense.bind(expenseController)
);

/**
 * @route   POST /api/v1/expenses/calculate-split/equal
 * @desc    Calculate equal split for expense
 * @access  Public (utility endpoint)
 */
router.post(
  '/calculate-split/equal',
  expenseController.calculateEqualSplit.bind(expenseController)
);

/**
 * @route   POST /api/v1/expenses/calculate-split/percentage
 * @desc    Calculate percentage split for expense
 * @access  Public (utility endpoint)
 */
router.post(
  '/calculate-split/percentage',
  expenseController.calculatePercentageSplit.bind(expenseController)
);

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
router.get('/:id', authenticate, expenseController.getExpense.bind(expenseController));

/**
 * @route   PUT /api/v1/expenses/:id
 * @desc    Update expense
 * @access  Private (Creator or Admin)
 */
router.put(
  '/:id',
  authenticate,
  validate(updateExpenseSchema),
  expenseController.updateExpense.bind(expenseController)
);

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Delete expense
 * @access  Private (Creator or Admin)
 */
router.delete('/:id', authenticate, expenseController.deleteExpense.bind(expenseController));

export default router;
