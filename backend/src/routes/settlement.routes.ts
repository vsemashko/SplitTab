import { Router } from 'express';
import { settlementController } from '../controllers/settlement.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createSettlementSchema, updateSettlementSchema } from '../types/validation';

const router = Router();

/**
 * @route   GET /api/v1/settlements
 * @desc    Get user's settlements
 * @access  Private
 */
router.get('/', authenticate, settlementController.getUserSettlements.bind(settlementController));

/**
 * @route   POST /api/v1/settlements
 * @desc    Create a new settlement
 * @access  Private
 */
router.post('/', authenticate, validate(createSettlementSchema), settlementController.createSettlement.bind(settlementController));

/**
 * @route   GET /api/v1/settlements/:id
 * @desc    Get settlement by ID
 * @access  Private
 */
router.get('/:id', authenticate, settlementController.getSettlement.bind(settlementController));

/**
 * @route   PUT /api/v1/settlements/:id
 * @desc    Update settlement
 * @access  Private (Involved parties or Admin)
 */
router.put('/:id', authenticate, validate(updateSettlementSchema), settlementController.updateSettlement.bind(settlementController));

/**
 * @route   POST /api/v1/settlements/:id/confirm
 * @desc    Confirm settlement (mark as paid)
 * @access  Private (Payee only)
 */
router.post('/:id/confirm', authenticate, settlementController.confirmSettlement.bind(settlementController));

/**
 * @route   POST /api/v1/settlements/:id/cancel
 * @desc    Cancel settlement
 * @access  Private (Involved parties)
 */
router.post('/:id/cancel', authenticate, settlementController.cancelSettlement.bind(settlementController));

/**
 * @route   DELETE /api/v1/settlements/:id
 * @desc    Delete settlement
 * @access  Private (Involved parties or Admin)
 */
router.delete('/:id', authenticate, settlementController.deleteSettlement.bind(settlementController));

export default router;
