import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as authService from './auth.service';
import { RegisterInput, LoginInput, RefreshInput } from './auth.schema';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body as RegisterInput);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body as LoginInput);
  res.json(result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshInput;
  const tokens = await authService.refresh(refreshToken);
  res.json(tokens);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshInput;
  await authService.logout(refreshToken);
  res.json({ message: 'Logged out' });
});
