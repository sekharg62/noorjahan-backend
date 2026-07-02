import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

export function formatSize(size: {
  id: string;
  label: string;
  sortOrder: number;
  description: string | null;
  createdAt: Date;
}) {
  return {
    id: size.id,
    label: size.label,
    sortOrder: size.sortOrder,
    description: size.description,
    createdAt: size.createdAt.toISOString(),
  };
}

export async function getAllSizes() {
  const sizes = await prisma.size.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  return sizes.map(formatSize);
}

export async function createSize(input: {
  label: string;
  sortOrder?: number;
  description?: string | null;
}) {
  const label = input.label.trim();

  if (!label) {
    throw new AppError(400, "label is required");
  }

  if (
    input.sortOrder !== undefined &&
    (!Number.isInteger(input.sortOrder) || input.sortOrder < 0)
  ) {
    throw new AppError(400, "sortOrder must be a non-negative integer");
  }

  const size = await prisma.size.create({
    data: {
      label,
      sortOrder: input.sortOrder ?? 0,
      description: input.description?.trim() || null,
    },
  });

  return formatSize(size);
}

export async function patchSize(
  id: string,
  input: {
    label?: string;
    sortOrder?: number;
    description?: string | null;
  },
) {
  const existing = await prisma.size.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Size not found");
  }

  if (
    input.label === undefined &&
    input.sortOrder === undefined &&
    input.description === undefined
  ) {
    throw new AppError(400, "At least one field is required to update");
  }

  const data: {
    label?: string;
    sortOrder?: number;
    description?: string | null;
  } = {};

  if (input.label !== undefined) {
    const label = input.label.trim();
    if (!label) {
      throw new AppError(400, "label cannot be empty");
    }
    data.label = label;
  }

  if (input.sortOrder !== undefined) {
    if (!Number.isInteger(input.sortOrder) || input.sortOrder < 0) {
      throw new AppError(400, "sortOrder must be a non-negative integer");
    }
    data.sortOrder = input.sortOrder;
  }

  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }

  const size = await prisma.size.update({
    where: { id },
    data,
  });

  return formatSize(size);
}

export async function deleteSize(id: string) {
  const existing = await prisma.size.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Size not found");
  }

  const [categoryCount, productCount] = await Promise.all([
    prisma.categorySize.count({ where: { sizeId: id } }),
    prisma.productSize.count({ where: { sizeId: id } }),
  ]);

  if (categoryCount > 0 || productCount > 0) {
    throw new AppError(
      409,
      "Cannot delete size that is assigned to a category or product",
    );
  }

  await prisma.size.delete({ where: { id } });

  return formatSize(existing);
}
