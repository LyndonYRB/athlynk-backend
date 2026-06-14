export function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  const status = error.status || error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    error: status >= 500 ? "Internal server error" : error.message,
    ...(status >= 500 && !isProduction ? { details: error.message } : {}),
  });
}
