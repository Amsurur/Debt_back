import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../middleware/auth';
import * as service from './contacts.service';

export const list = asyncHandler<AuthRequest>(async (req, res) => {
  const folderId = typeof req.query.folder_id === 'string' ? req.query.folder_id : undefined;
  res.json(await service.list(req.user!.id, folderId));
});

export const getOne = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(await service.getOne(req.user!.id, req.params.id));
});

export const create = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(201).json(await service.create(req.user!.id, req.body));
});

export const update = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(await service.update(req.user!.id, req.params.id, req.body));
});

export const remove = asyncHandler<AuthRequest>(async (req, res) => {
  await service.remove(req.user!.id, req.params.id);
  res.status(204).send();
});
