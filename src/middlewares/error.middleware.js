// 404 Route Not Found Handler
export function notFoundHandler(req, res, next) {
  res.status(404).send({ message: 'Route not found' });
}

// Global Error Handler
export function errorHandler(err, req, res, next) {
  console.error('Server Internal Error:', err);
  res.status(500).send({ message: 'Internal Server Error' });
}
