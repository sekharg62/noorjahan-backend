import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/adminAuth";
import { AppError } from "../../middleware/errorHandler";
import { getDashboardStats, getSalesByDateRange } from "./dashboard.service";

function getQueryParam(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

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

export async function getSales(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const from = getQueryParam(req.query.from);
    const to = getQueryParam(req.query.to);

    if (!from || !to) {
      throw new AppError(400, "from and to are required (YYYY-MM-DD)");
    }

    const data = await getSalesByDateRange(from, to);

    res.json({
      success: true,
      message: "Sales data fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
