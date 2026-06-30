import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../middleware/errorHandler";
import { loginCustomer, registerCustomer } from "./auth.service";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, phone, email, password } = req.body as {
      name?: string;
      phone?: string;
      email?: string;
      password?: string;
    };

    if (!name?.trim() || !phone?.trim() || !password) {
      throw new AppError(400, "name, phone, and password are required");
    }

    const result = await registerCustomer({
      name,
      phone,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { phone, password } = req.body as {
      phone?: string;
      password?: string;
    };

    if (!phone?.trim() || !password) {
      throw new AppError(400, "phone and password are required");
    }

    const result = await loginCustomer({ phone, password });

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
