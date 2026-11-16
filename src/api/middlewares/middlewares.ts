import { Request, Response, NextFunction } from 'express';

export function notFound(req:Request, res:Response, next:NextFunction) {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

// Express only treats a handler as an error handler when it declares all four arguments, so `next` must stay.
export function errorHandler(
  error:Error & { status?: number, statusCode?: number },
  req:Request,
  res:Response,
  next:NextFunction,
) {
  if (res.headersSent) {
    next(error);
    return;
  }
  // Keep the HTTP status that body parsers and other middleware attach to their errors (e.g. 400 for bad JSON)
  const errorStatus = error.status ?? error.statusCode;
  const hasHttpStatus = typeof errorStatus === 'number' && errorStatus >= 400 && errorStatus < 600;
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (hasHttpStatus) statusCode = errorStatus;
  res.status(statusCode);
  res.json({
    status: statusCode,
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
  });
}
