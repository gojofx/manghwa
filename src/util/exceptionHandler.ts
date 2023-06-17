import express from 'express'
export function exceptionHandler(fn: any) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    fn(req, res, next).catch((error: any) => next(error))
  }
}
