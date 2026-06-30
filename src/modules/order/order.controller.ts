import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/adminAuth";
import type { CustomerRequest } from "../../middleware/customerAuth";
import {
  getAdminOrders,
  getCustomerOrders,
  getOrderByOrderNo,
  placeOrder,
  updateOrderStatus,
} from "./order.service";

function getParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function getQueryParam(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function create(
  req: CustomerRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as {
      addressId?: string;
      guest?: {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        city?: string;
        pincode?: string;
      };
      paymentMethod?: string;
      items?: Array<{
        productId?: string;
        quantity?: number;
        size?: string;
      }>;
    };

    const result = await placeOrder({
      customerId: req.customer?.id,
      addressId: body.addressId,
      guest: body.guest
        ? {
            name: body.guest.name ?? "",
            phone: body.guest.phone ?? "",
            email: body.guest.email,
            address: body.guest.address ?? "",
            city: body.guest.city ?? "",
            pincode: body.guest.pincode ?? "",
          }
        : undefined,
      paymentMethod: body.paymentMethod ?? "",
      items: (body.items ?? []).map((item) => ({
        productId: item.productId ?? "",
        quantity: item.quantity ?? 0,
        size: item.size,
      })),
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: {
        orderNo: result.orderNo,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getByOrderNo(
  req: CustomerRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getOrderByOrderNo(getParam(req.params.orderNo));

    res.json({
      success: true,
      message: "Order fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrders(
  req: CustomerRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.customer?.id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const data = await getCustomerOrders(req.customer.id);

    res.json({
      success: true,
      message: "Customer orders fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminOrders({
      page: getQueryParam(req.query.page),
      limit: getQueryParam(req.query.limit),
      status: getQueryParam(req.query.status),
      orderNo:
        getQueryParam(req.query.orderNo) ?? getQueryParam(req.query.order),
    });

    res.json({
      success: true,
      message: "Orders fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { status } = req.body as { status?: string };

    if (!status) {
      res.status(400).json({ success: false, message: "status is required" });
      return;
    }

    const data = await updateOrderStatus(getParam(req.params.id), status);

    res.json({
      success: true,
      message: "Order status updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
