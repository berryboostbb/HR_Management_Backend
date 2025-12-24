import { ValidationError } from "joi";
import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  status?: number;
}

const errorHandler = (
  error: CustomError | ValidationError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  const status =
    error instanceof ValidationError
      ? 400
      : (error as CustomError).status || 500;
  const message =
    error instanceof ValidationError
      ? error.message
      : error.message || "Internal Server Error";

  return res.status(status).json({ message });
};

export default errorHandler;
