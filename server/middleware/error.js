/** 404 for unknown routes. */
exports.notFound = (req, _res, next) => {
  const err = new Error(`Not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

/** Central error handler: turns common Mongoose/JWT errors into clean JSON. */
exports.errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err.code === 11000) {
    status = 400;
    message = `${Object.keys(err.keyValue)[0]} already in use`;
  } else if (err.name === 'CastError') {
    status = 404;
    message = 'Resource not found';
  }

  if (status === 500) console.error(err);
  res.status(status).json({
    message:
      status === 500 && process.env.NODE_ENV === 'production' ? 'Server error' : message,
  });
};
