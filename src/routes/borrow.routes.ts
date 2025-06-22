import { Router } from 'express';
import * as borrowController from '../controllers/borrow.controller';

const router = Router();

router.post('/', borrowController.borrowBook);
router.get('/', borrowController.getBorrowSummary);

export default router;
