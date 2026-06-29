import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

type DbProductImage = {
  id: string;
  productId: string;
  imgUrl: string;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function formatProductImage(item: DbProductImage) {
  return {
    id: item.id,
    productId: item.productId,
    imgUrl: item.imgUrl,
    displayOrder: item.displayOrder,
    isPrimary: item.isPrimary,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

interface CreateProductImageInput {
  productId: string;
  imgUrl: string;
  displayOrder: number;
  isPrimary: boolean;
}

export async function createProductImage(input: CreateProductImageInput) {
  const productId = input.productId.trim();
  const imgUrl = input.imgUrl.trim();

  if (!productId) {
    throw new AppError(400, "productId is required");
  }

  if (!imgUrl) {
    throw new AppError(400, "imgUrl is required");
  }

  if (input.displayOrder === undefined || input.displayOrder === null) {
    throw new AppError(400, "displayOrder is required");
  }

  if (!Number.isInteger(input.displayOrder) || input.displayOrder < 0) {
    throw new AppError(400, "displayOrder must be a non-negative integer");
  }

  if (input.isPrimary === undefined || input.isPrimary === null) {
    throw new AppError(400, "isPrimary is required");
  }

  if (typeof input.isPrimary !== "boolean") {
    throw new AppError(400, "isPrimary must be a boolean");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const existingOrder = await prisma.productImage.findUnique({
    where: {
      productId_displayOrder: {
        productId,
        displayOrder: input.displayOrder,
      },
    },
  });

  if (existingOrder) {
    throw new AppError(409, "displayOrder already exists for this product");
  }

  if (input.isPrimary) {
    const existingPrimary = await prisma.productImage.findFirst({
      where: {
        productId,
        isPrimary: true,
      },
    });

    if (existingPrimary) {
      throw new AppError(409, "A primary image already exists for this product");
    }
  }

  const productImage = await prisma.productImage.create({
    data: {
      productId,
      imgUrl,
      displayOrder: input.displayOrder,
      isPrimary: input.isPrimary,
    },
  });

  return formatProductImage(productImage);
}
