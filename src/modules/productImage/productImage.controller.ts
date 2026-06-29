import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/adminAuth";
import { createProductImage } from "./productImage.service";

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { productId, imgUrl, displayOrder, isPrimary } = req.body as {
      productId?: string;
      imgUrl?: string;
      displayOrder?: number;
      isPrimary?: boolean;
    };

    const data = await createProductImage({
      productId: productId ?? "",
      imgUrl: imgUrl ?? "",
      displayOrder: displayOrder as number,
      isPrimary: isPrimary as boolean,
    });

    res.status(201).json({
      success: true,
      message: "Product image created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
