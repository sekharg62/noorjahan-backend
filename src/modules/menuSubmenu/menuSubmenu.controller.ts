import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/adminAuth";
import {
  createMenuSubmenu,
  deleteMenuSubmenu,
  getAllMenuSubmenus,
  getMenuSubmenuById,
  patchMenuSubmenu,
  updateMenuSubmenu,
} from "./menuSubmenu.service";

function getIdParam(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

export async function getAll(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = typeof req.query.page === "string" ? req.query.page : undefined;
    const limit =
      typeof req.query.limit === "string" ? req.query.limit : undefined;

    const data = await getAllMenuSubmenus({ page, limit });

    res.json({
      success: true,
      message: "Menu items fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getMenuSubmenuById(getIdParam(req));

    res.json({
      success: true,
      message: "Menu item fetched successfully",
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
    const { name, slug, parentId } = req.body as {
      name?: string;
      slug?: string;
      parentId?: string | null;
    };

    const data = await createMenuSubmenu({ name: name ?? "", slug, parentId });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, slug, parentId } = req.body as {
      name?: string;
      slug?: string;
      parentId?: string | null;
    };

    const data = await updateMenuSubmenu(getIdParam(req), {
      name: name ?? "",
      slug: slug ?? "",
      parentId,
    });

    res.json({
      success: true,
      message: "Menu item updated successfully",
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
    const { name, slug, parentId } = req.body as {
      name?: string;
      slug?: string;
      parentId?: string | null;
    };

    const data = await patchMenuSubmenu(getIdParam(req), {
      name,
      slug,
      parentId,
    });

    res.json({
      success: true,
      message: "Menu item patched successfully",
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
    const data = await deleteMenuSubmenu(getIdParam(req));

    res.json({
      success: true,
      message: "Menu item deleted successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
