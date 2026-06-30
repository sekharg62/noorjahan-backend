import type { NextFunction, Response } from "express";
import type { CustomerRequest } from "../../../middleware/customerAuth";
import { AppError } from "../../../middleware/errorHandler";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
} from "./address.service";

function getIdParam(req: CustomerRequest): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

function requireCustomerId(req: CustomerRequest): string {
  if (!req.customer?.id) {
    throw new AppError(401, "Authentication required");
  }

  return req.customer.id;
}

export async function create(
  req: CustomerRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const customerId = requireCustomerId(req);
    const { fullName, phone, address, city, pincode, alternativePh, notes } =
      req.body as {
        fullName?: string;
        phone?: string;
        address?: string;
        city?: string;
        pincode?: string;
        alternativePh?: string;
        notes?: string;
      };

    if (!fullName?.trim() || !phone?.trim() || !address?.trim() || !city?.trim() || !pincode?.trim()) {
      throw new AppError(
        400,
        "fullName, phone, address, city, and pincode are required",
      );
    }

    const data = await createCustomerAddress(customerId, {
      fullName,
      phone,
      address,
      city,
      pincode,
      alternativePh,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: CustomerRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const customerId = requireCustomerId(req);
    const { fullName, phone, address, city, pincode, alternativePh, notes } =
      req.body as {
        fullName?: string;
        phone?: string;
        address?: string;
        city?: string;
        pincode?: string;
        alternativePh?: string | null;
        notes?: string | null;
      };

    const data = await updateCustomerAddress(customerId, getIdParam(req), {
      fullName,
      phone,
      address,
      city,
      pincode,
      alternativePh,
      notes,
    });

    res.json({
      success: true,
      message: "Address updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: CustomerRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const customerId = requireCustomerId(req);

    await deleteCustomerAddress(customerId, getIdParam(req));

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
