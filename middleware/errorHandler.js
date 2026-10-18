module.exports = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: 'A record with those details already exists' });
  }

  const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  return res.status(status).json({
    error: status === 500 ? 'Internal server error' : error.message
  });
};