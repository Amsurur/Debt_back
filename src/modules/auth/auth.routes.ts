import { Router } from 'express';
import * as controller from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';

const router = Router();

router.post('/register', validateBody(registerSchema), controller.register);
router.post('/login', validateBody(loginSchema), controller.login);
router.post('/refresh', validateBody(refreshSchema), controller.refresh);
router.post('/logout', validateBody(refreshSchema), controller.logout);

export default router;
