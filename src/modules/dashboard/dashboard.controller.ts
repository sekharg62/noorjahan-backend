import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/adminAuth";
import { getDashboardStats } from "./dashboard.service";

export async function getDashboard(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getDashboardStats();

    res.json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
