import { Router } from 'express';
import * as controller from './debts.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createDebtSchema, updateDebtSchema, createPaymentSchema } from './debts.schema';

const router = Router();
router.use(authenticate);

// Debts — filters: ?status= &contact_id= &direction=
router.get('/', controller.list);
router.post('/', validateBody(createDebtSchema), controller.create);
router.get('/:id', controller.getOne);
router.patch('/:id', validateBody(updateDebtSchema), controller.update);
router.delete('/:id', controller.remove);

// Payments for a debt
router.get('/:id/payments', controller.listPayments);
router.post('/:id/payments', validateBody(createPaymentSchema), controller.addPayment);

export default router;
