import express from 'express';
import * as QuickCommandTagController from './quick-command-tag.controller';
import { isAuthenticated } from '../auth/auth.middleware';

const router = express.Router();

router.get('/', isAuthenticated, QuickCommandTagController.getAllQuickCommandTags);
router.post('/', isAuthenticated, QuickCommandTagController.addQuickCommandTag);
router.put('/reorder', isAuthenticated, QuickCommandTagController.reorderQuickCommandTags);
router.put('/:id', isAuthenticated, QuickCommandTagController.updateQuickCommandTag);
router.delete('/:id', isAuthenticated, QuickCommandTagController.deleteQuickCommandTag);

export default router;
