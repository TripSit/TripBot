import type { NextFunction, Request, Response } from 'express';

export function errorHandler(
  error: Error,
  request: Request,
  response: Response /* , next:any */,
): void {
  const statusCode = response.statusCode === 200 ? 500 : response.statusCode;
  response.status(statusCode);
  response.json({
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
    status: statusCode,
  });
}

export function notFound(request: Request, response: Response, next: NextFunction): void {
  const error = new Error(`Not found - ${request.originalUrl}`);
  response.status(404);
  next(error);
}
