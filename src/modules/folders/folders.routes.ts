import { Router } from 'express';
import * as controller from './folders.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createFolderSchema, updateFolderSchema } from './folders.schema';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.post('/', validateBody(createFolderSchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validateBody(updateFolderSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
