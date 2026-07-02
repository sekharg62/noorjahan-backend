import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/adminAuth";
import {
  createSize,
  deleteSize,
  getAllSizes,
  patchSize,
} from "./size.service";

function getIdParam(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

export async function getAll(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getAllSizes();

    res.json({
      success: true,
      message: "Sizes fetched successfully",
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
    const { label, sortOrder, description } = req.body as {
      label?: string;
      sortOrder?: number;
      description?: string | null;
    };

    const data = await createSize({ label: label ?? "", sortOrder, description });

    res.status(201).json({
      success: true,
      message: "Size created successfully",
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
    const { label, sortOrder, description } = req.body as {
      label?: string;
      sortOrder?: number;
      description?: string | null;
    };

    const data = await patchSize(getIdParam(req), { label, sortOrder, description });

    res.json({
      success: true,
      message: "Size updated successfully",
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
    const data = await deleteSize(getIdParam(req));

    res.json({
      success: true,
      message: "Size deleted successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
