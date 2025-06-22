import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(400).json({
    message: err.message || 'Validation failed',
    success: false,
    error: err,
  });
};
