import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../middleware/errorHandler";
import { loginAdmin } from "./auth.service";

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email?.trim() || !password) {
      throw new AppError(400, "Email and password are required");
    }

    const result = await loginAdmin({ email, password });

    res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
