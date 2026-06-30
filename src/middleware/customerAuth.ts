import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { verifyCustomerToken } from "../utils/jwt";

export interface CustomerRequest extends Request {
  customer?: {
    id: string;
    phone: string;
  };
}

export function customerAuth(
  req: CustomerRequest,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication required");
    }

    const token = authHeader.slice(7);
    const payload = verifyCustomerToken(token);

    req.customer = {
      id: payload.sub,
      phone: payload.phone,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, "Invalid or expired token"));
      return;
    }

    next(error);
  }
}

export function optionalCustomerAuth(
  req: CustomerRequest,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyCustomerToken(token);

    req.customer = {
      id: payload.sub,
      phone: payload.phone,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, "Invalid or expired token"));
      return;
    }

    next(error);
  }
}
