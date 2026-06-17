import { Router } from 'express';
import { z } from 'zod';
import * as controller from './users.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';

const updateSchema = z.object({ name: z.string().min(1).max(120) });

const router = Router();
router.use(authenticate);

router.get('/me', controller.me);
router.patch('/me', validateBody(updateSchema), controller.updateMe);

export default router;
