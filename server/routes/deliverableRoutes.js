import express from 'express';
import {
  getDeliverables,
  getDeliverable,
  createDeliverable,
  updateDeliverable,
  deleteDeliverable,
  addNote
} from '../controllers/deliverableController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All deliverable routes require authentication
router.use(protect);

router.get('/', getDeliverables);
router.get('/:id', getDeliverable);
router.post('/', adminOnly, createDeliverable);
router.put('/:id', updateDeliverable);
router.delete('/:id', adminOnly, deleteDeliverable);
router.post('/:id/notes', addNote);

export default router;

