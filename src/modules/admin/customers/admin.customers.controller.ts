import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../../middleware/adminAuth";
import { getAdminCustomers } from "./admin.customers.service";

function getQueryParam(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function getAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminCustomers({
      page: getQueryParam(req.query.page),
      limit: getQueryParam(req.query.limit),
      search: getQueryParam(req.query.search),
    });

    res.json({
      success: true,
      message: "Customers fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
