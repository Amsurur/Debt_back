import { Router } from 'express';
import * as controller from './dashboard.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/summary', controller.summary);

export default router;
