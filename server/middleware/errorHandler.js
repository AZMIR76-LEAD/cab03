// FG DRIVO Enterprise Centralized Error Handling Middleware

export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Wraps async controller methods to automatically forward unhandled errors to Express next()
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 Route Handler
export function notFoundHandler(req, res, next) {
  const error = new ApiError(`Endpoint not found: [${req.method}] ${req.originalUrl}`, 404);
  next(error);
}

// Central Error Response Middleware
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error(`\x1b[31m[CRITICAL EXCEPTION] ${req.method} ${req.originalUrl}:\x1b[0m`, err.stack);
  }

  return res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    details: err.details || null,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
