import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../middleware/auth';
import * as service from './debts.service';

function strOrUndef(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export const list = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(
    await service.list(req.user!.id, {
      status: strOrUndef(req.query.status),
      contact_id: strOrUndef(req.query.contact_id),
      direction: strOrUndef(req.query.direction),
    })
  );
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

export const listPayments = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(await service.listPayments(req.user!.id, req.params.id));
});

export const addPayment = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(201).json(await service.addPayment(req.user!.id, req.params.id, req.body));
});
