import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so any thrown/rejected error is forwarded
 * to Express's error middleware instead of crashing the process.
 *
 * Use the generic to get a typed request, e.g. asyncHandler<AuthRequest>(...)
 */
export const asyncHandler =
  <Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    fn(req as Req, res, next).catch(next);
  };
