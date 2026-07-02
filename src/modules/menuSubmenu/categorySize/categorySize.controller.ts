import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../../middleware/adminAuth";
import {
  addCategorySize,
  getCategorySizes,
  patchCategorySize,
  removeCategorySize,
  syncCategorySizes,
} from "./categorySize.service";

function getMenuSubmenuIdParam(req: Request): string {
  const { menuSubmenuId } = req.params;
  return Array.isArray(menuSubmenuId) ? menuSubmenuId[0] : menuSubmenuId;
}

function getCategorySizeIdParam(req: Request): string {
  const { categorySizeId } = req.params;
  return Array.isArray(categorySizeId) ? categorySizeId[0] : categorySizeId;
}

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getCategorySizes(getMenuSubmenuIdParam(req));

    res.json({
      success: true,
      message: "Category sizes fetched successfully",
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
    const { sizeId, displayOrder } = req.body as {
      sizeId?: string;
      displayOrder?: number;
    };

    const data = await addCategorySize(getMenuSubmenuIdParam(req), {
      sizeId: sizeId ?? "",
      displayOrder,
    });

    res.status(201).json({
      success: true,
      message: "Size assigned to category successfully",
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
      sizes?: Array<{ sizeId?: string; displayOrder?: number }>;
    };

    const data = await syncCategorySizes(
      getMenuSubmenuIdParam(req),
      (sizes ?? []).map((entry) => ({
        sizeId: entry.sizeId ?? "",
        displayOrder: entry.displayOrder,
      })),
    );

    res.json({
      success: true,
      message: "Category sizes updated successfully",
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
    const { displayOrder } = req.body as { displayOrder?: number };

    const data = await patchCategorySize(
      getMenuSubmenuIdParam(req),
      getCategorySizeIdParam(req),
      { displayOrder },
    );

    res.json({
      success: true,
      message: "Category size updated successfully",
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
    const data = await removeCategorySize(
      getMenuSubmenuIdParam(req),
      getCategorySizeIdParam(req),
    );

    res.json({
      success: true,
      message: "Size removed from category successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
