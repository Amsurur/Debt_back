import { Router } from 'express';
import * as controller from './contacts.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createContactSchema, updateContactSchema } from './contacts.schema';

const router = Router();
router.use(authenticate);

router.get('/', controller.list); // optional ?folder_id=...
router.post('/', validateBody(createContactSchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validateBody(updateContactSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
