import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../middleware/auth';
import * as service from './dashboard.service';

export const summary = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(await service.summary(req.user!.id));
});
