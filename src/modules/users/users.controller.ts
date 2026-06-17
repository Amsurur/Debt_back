import { Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../middleware/auth';
import * as usersService from './users.service';

export const me = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = await usersService.getById(req.user!.id);
  res.json(user);
});

export const updateMe = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = await usersService.updateProfile(req.user!.id, req.body);
  res.json(user);
});
