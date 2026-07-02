import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/adminAuth";
import { createProduct, deleteProduct, getAllProducts, getProductBySlug, getProductsByCategory, patchProduct, searchProducts } from "./product.service";

function getQueryParam(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getSlugParam(req: Request): string {
  const { slug } = req.params;
  return Array.isArray(slug) ? slug[0] : slug;
}

function getIdParam(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
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

export async function search(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const q = getQueryParam(req.query.q) ?? getQueryParam(req.query.search);

    if (!q?.trim()) {
      res.status(400).json({
        success: false,
        message: "q is required",
      });
      return;
    }

    const data = await searchProducts(q);

    res.json({
      success: true,
      message: "Products searched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getProductBySlug(getSlugParam(req));

    res.json({
      success: true,
      message: "Product fetched successfully",
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
    const { menuSubmenuId, name, slug, description, price, offerPrice, isActive } =
      req.body as {
        menuSubmenuId?: string;
        name?: string;
        slug?: string;
        description?: string;
        price?: string;
        offerPrice?: string;
        isActive?: boolean;
      };

    const data = await createProduct({
      menuSubmenuId: menuSubmenuId ?? "",
      name: name ?? "",
      slug: slug ?? "",
      description: description ?? "",
      price: price ?? "",
      offerPrice,
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

export async function patch(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { menuSubmenuId, name, slug, description, price, offerPrice, isActive } =
      req.body as {
        menuSubmenuId?: string;
        name?: string;
        slug?: string;
        description?: string;
        price?: string;
        offerPrice?: string | null;
        isActive?: boolean;
      };

    const data = await patchProduct(getIdParam(req), {
      menuSubmenuId,
      name,
      slug,
      description,
      price,
      offerPrice,
      isActive,
    });

    res.json({
      success: true,
      message: "Product updated successfully",
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
    const data = await deleteProduct(getIdParam(req));

    res.json({
      success: true,
      message: "Product deleted successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
