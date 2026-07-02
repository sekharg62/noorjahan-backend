import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../../middleware/adminAuth";
import {
  addProductSize,
  getProductSizes,
  patchProductSize,
  removeProductSize,
  syncProductSizes,
} from "./productSize.service";

function getProductIdParam(req: Request): string {
  const { productId } = req.params;
  return Array.isArray(productId) ? productId[0] : productId;
}

function getProductSizeIdParam(req: Request): string {
  const { productSizeId } = req.params;
  return Array.isArray(productSizeId) ? productSizeId[0] : productSizeId;
}

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getProductSizes(getProductIdParam(req));

    res.json({
      success: true,
      message: "Product sizes fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sizeId, stock, sku } = req.body as {
      sizeId?: string;
      stock?: number;
      sku?: string | null;
    };

    const data = await addProductSize(getProductIdParam(req), {
      sizeId: sizeId ?? "",
      stock,
      sku,
    });

    res.status(201).json({
      success: true,
      message: "Product size created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function sync(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sizes } = req.body as {
      sizes?: Array<{
        sizeId?: string;
        stock?: number;
        sku?: string | null;
      }>;
    };

    const data = await syncProductSizes(
      getProductIdParam(req),
      (sizes ?? []).map((entry) => ({
        sizeId: entry.sizeId ?? "",
        stock: entry.stock,
        sku: entry.sku,
      })),
    );

    res.json({
      success: true,
      message: "Product sizes updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function patch(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { stock, sku } = req.body as {
      stock?: number;
      sku?: string | null;
    };

    const data = await patchProductSize(
      getProductIdParam(req),
      getProductSizeIdParam(req),
      { stock, sku },
    );

    res.json({
      success: true,
      message: "Product size updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await removeProductSize(
      getProductIdParam(req),
      getProductSizeIdParam(req),
    );

    res.json({
      success: true,
      message: "Product size removed successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
