import { prisma } from "../../../config/database";
import { AppError } from "../../../middleware/errorHandler";
import { formatSize } from "../../size/size.service";

export function formatProductSizeRecord(item: {
  id: string;
  productId: string;
  stock: number;
  sku: string | null;
  createdAt: Date;
  updatedAt: Date;
  size: {
    id: string;
    label: string;
    sortOrder: number;
    description: string | null;
    createdAt: Date;
  };
}) {
  return {
    id: item.id,
    productId: item.productId,
    sizeId: item.size.id,
    stock: item.stock,
    sku: item.sku,
    size: formatSize(item.size),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

async function getProductOrThrow(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  return product;
}

async function ensureSizeAllowedForProduct(
  menuSubmenuId: string,
  sizeId: string,
) {
  const categorySize = await prisma.categorySize.findUnique({
    where: {
      menuSubmenuId_sizeId: { menuSubmenuId, sizeId },
    },
  });

  if (!categorySize) {
    throw new AppError(
      400,
      "Size is not available for this product category",
    );
  }
}

export async function getProductSizes(productId: string) {
  await getProductOrThrow(productId);

  const productSizes = await prisma.productSize.findMany({
    where: { productId },
    include: { size: true },
    orderBy: { size: { sortOrder: "asc" } },
  });

  return productSizes.map(formatProductSizeRecord);
}

export async function addProductSize(
  productId: string,
  input: { sizeId: string; stock?: number; sku?: string | null },
) {
  const product = await getProductOrThrow(productId);

  const sizeId = input.sizeId.trim();
  if (!sizeId) {
    throw new AppError(400, "sizeId is required");
  }

  const size = await prisma.size.findUnique({ where: { id: sizeId } });
  if (!size) {
    throw new AppError(404, "Size not found");
  }

  await ensureSizeAllowedForProduct(product.menuSubmenuId, sizeId);

  const stock = input.stock ?? 0;
  if (!Number.isInteger(stock) || stock < 0) {
    throw new AppError(400, "stock must be a non-negative integer");
  }

  const existing = await prisma.productSize.findUnique({
    where: {
      productId_sizeId: { productId, sizeId },
    },
  });

  if (existing) {
    throw new AppError(409, "Size is already assigned to this product");
  }

  const productSize = await prisma.productSize.create({
    data: {
      productId,
      sizeId,
      stock,
      sku: input.sku?.trim() || null,
    },
    include: { size: true },
  });

  return formatProductSizeRecord(productSize);
}

export async function syncProductSizes(
  productId: string,
  sizes: Array<{ sizeId: string; stock?: number; sku?: string | null }>,
) {
  const product = await getProductOrThrow(productId);

  if (!sizes.length) {
    throw new AppError(400, "At least one size is required");
  }

  const normalized = sizes.map((entry) => {
    const sizeId = entry.sizeId.trim();
    if (!sizeId) {
      throw new AppError(400, "sizeId is required for each entry");
    }

    const stock = entry.stock ?? 0;
    if (!Number.isInteger(stock) || stock < 0) {
      throw new AppError(400, "stock must be a non-negative integer");
    }

    return {
      sizeId,
      stock,
      sku: entry.sku?.trim() || null,
    };
  });

  const uniqueSizeIds = new Set(normalized.map((entry) => entry.sizeId));
  if (uniqueSizeIds.size !== normalized.length) {
    throw new AppError(400, "Duplicate sizeId in request");
  }

  for (const entry of normalized) {
    await ensureSizeAllowedForProduct(product.menuSubmenuId, entry.sizeId);
  }

  await prisma.$transaction(async (tx) => {
    await tx.productSize.deleteMany({ where: { productId } });

    await tx.productSize.createMany({
      data: normalized.map((entry) => ({
        productId,
        sizeId: entry.sizeId,
        stock: entry.stock,
        sku: entry.sku,
      })),
    });
  });

  return getProductSizes(productId);
}

export async function patchProductSize(
  productId: string,
  productSizeId: string,
  input: { stock?: number; sku?: string | null },
) {
  await getProductOrThrow(productId);

  const existing = await prisma.productSize.findFirst({
    where: { id: productSizeId, productId },
    include: { size: true },
  });

  if (!existing) {
    throw new AppError(404, "Product size not found");
  }

  if (input.stock === undefined && input.sku === undefined) {
    throw new AppError(400, "At least one field is required to update");
  }

  const data: { stock?: number; sku?: string | null } = {};

  if (input.stock !== undefined) {
    if (!Number.isInteger(input.stock) || input.stock < 0) {
      throw new AppError(400, "stock must be a non-negative integer");
    }
    data.stock = input.stock;
  }

  if (input.sku !== undefined) {
    data.sku = input.sku?.trim() || null;
  }

  const productSize = await prisma.productSize.update({
    where: { id: productSizeId },
    data,
    include: { size: true },
  });

  return formatProductSizeRecord(productSize);
}

export async function removeProductSize(
  productId: string,
  productSizeId: string,
) {
  await getProductOrThrow(productId);

  const existing = await prisma.productSize.findFirst({
    where: { id: productSizeId, productId },
    include: { size: true },
  });

  if (!existing) {
    throw new AppError(404, "Product size not found");
  }

  await prisma.productSize.delete({ where: { id: productSizeId } });

  return formatProductSizeRecord(existing);
}
