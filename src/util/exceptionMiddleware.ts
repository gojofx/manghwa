import express from 'express'
export function exceptionMiddleware(
  error: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  // Express-validator
  if (
    (error.status === 400 ||
      error.statusCode === '400' ||
      error.statusCode === 400) &&
    error.data[0]?.msg
  ) {
    error.message = error.data[0].msg
  }
  const status = error.status || error.statusCode || 500
  const message = error.message
  const data = error.data
  res.status(status).json({ message, data })
}
