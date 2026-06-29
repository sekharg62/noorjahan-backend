import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/adminAuth";
import { createProduct, getAllProducts, getProductsByCategory } from "./product.service";

function getQueryParam(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = getQueryParam(req.query.category);

    if (category) {
      const data = await getProductsByCategory(category);

      res.json({
        success: true,
        message: "Products fetched successfully",
        data,
      });
      return;
    }

    const data = await getAllProducts({
      page: getQueryParam(req.query.page),
      limit: getQueryParam(req.query.limit),
      menuId: getQueryParam(req.query.menuId),
      submenuId: getQueryParam(req.query.submenuId),
    });

    res.json({
      success: true,
      message: "Products fetched successfully",
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
    const { menuSubmenuId, name, slug, description, price, offerPrice, stock, isActive } =
      req.body as {
        menuSubmenuId?: string;
        name?: string;
        slug?: string;
        description?: string;
        price?: string;
        offerPrice?: string;
        stock?: number;
        isActive?: boolean;
      };

    const data = await createProduct({
      menuSubmenuId: menuSubmenuId ?? "",
      name: name ?? "",
      slug: slug ?? "",
      description: description ?? "",
      price: price ?? "",
      offerPrice,
      stock,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
