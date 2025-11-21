import { Router } from 'express';
import { receiptController } from '../controllers/receipt.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../utils/fileUpload';

const router = Router();

/**
 * @route   POST /api/v1/receipts/upload
 * @desc    Upload a receipt
 * @access  Private
 */
router.post(
  '/upload',
  authenticate,
  upload.single('receipt'),
  receiptController.uploadReceipt.bind(receiptController)
);

/**
 * @route   GET /api/v1/receipts/queue/stats
 * @desc    Get queue statistics
 * @access  Private
 */
router.get(
  '/queue/stats',
  authenticate,
  receiptController.getQueueStats.bind(receiptController)
);

/**
 * @route   GET /api/v1/receipts/statistics/ocr
 * @desc    Get OCR statistics
 * @access  Private
 */
router.get(
  '/statistics/ocr',
  authenticate,
  receiptController.getOCRStatistics.bind(receiptController)
);

/**
 * @route   GET /api/v1/receipts
 * @desc    Get user's receipts
 * @access  Private
 */
router.get('/', authenticate, receiptController.getUserReceipts.bind(receiptController));

/**
 * @route   GET /api/v1/receipts/:id
 * @desc    Get receipt by ID
 * @access  Private
 */
router.get('/:id', authenticate, receiptController.getReceipt.bind(receiptController));

/**
 * @route   PUT /api/v1/receipts/:id
 * @desc    Update receipt
 * @access  Private
 */
router.put('/:id', authenticate, receiptController.updateReceipt.bind(receiptController));

/**
 * @route   POST /api/v1/receipts/:id/attach
 * @desc    Attach receipt to expense
 * @access  Private
 */
router.post('/:id/attach', authenticate, receiptController.attachToExpense.bind(receiptController));

/**
 * @route   POST /api/v1/receipts/:id/detach
 * @desc    Detach receipt from expense
 * @access  Private
 */
router.post('/:id/detach', authenticate, receiptController.detachFromExpense.bind(receiptController));

/**
 * @route   POST /api/v1/receipts/:id/retry-ocr
 * @desc    Retry OCR processing
 * @access  Private
 */
router.post('/:id/retry-ocr', authenticate, receiptController.retryOCR.bind(receiptController));

/**
 * @route   DELETE /api/v1/receipts/:id
 * @desc    Delete receipt
 * @access  Private
 */
router.delete('/:id', authenticate, receiptController.deleteReceipt.bind(receiptController));

export default router;
