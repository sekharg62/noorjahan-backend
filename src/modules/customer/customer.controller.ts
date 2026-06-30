import type { NextFunction, Response } from "express";
import type { CustomerRequest } from "../../middleware/customerAuth";
import { getCustomerProfile } from "./customer.service";

export async function getMe(
  req: CustomerRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.customer?.id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const data = await getCustomerProfile(req.customer.id);

    res.json({
      success: true,
      message: "Customer profile fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
