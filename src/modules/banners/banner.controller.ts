import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/adminAuth";
import {
  createBanner,
  deleteBanner,
  getAllBanners,
  updateBanner,
} from "./banner.service";

export async function getAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const type =
      typeof req.query.type === "string" ? req.query.type : undefined;
    const data = await getAllBanners(type);

    res.json({
      success: true,
      message: "Banners fetched successfully",
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
    const { imgUrl, redirectUrl, order, type } = req.body as {
      imgUrl?: string;
      redirectUrl?: string;
      order?: number;
      type?: string;
    };

    if (order === undefined) {
      res.status(400).json({
        success: false,
        message: "order is required",
      });
      return;
    }

    const data = await createBanner({
      imgUrl: imgUrl ?? "",
      redirectUrl,
      order,
      type,
    });

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

function getIdParam(req: Request): string {
  const { id } = req.params;
  return Array.isArray(id) ? id[0] : id;
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { imgUrl, redirectUrl, order, type } = req.body as {
      imgUrl?: string;
      redirectUrl?: string;
      order?: number;
      type?: string;
    };

    if (order === undefined) {
      res.status(400).json({
        success: false,
        message: "order is required",
      });
      return;
    }

    const data = await updateBanner(getIdParam(req), {
      imgUrl: imgUrl ?? "",
      redirectUrl,
      order,
      type,
    });

    res.json({
      success: true,
      message: "Banner updated successfully",
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
    const data = await deleteBanner(getIdParam(req));

    res.json({
      success: true,
      message: "Banner deleted successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
