import { prisma } from "../../../config/database";
import { AppError } from "../../../middleware/errorHandler";
import { formatSize } from "../../size/size.service";

function formatCategorySize(item: {
  id: string;
  menuSubmenuId: string;
  displayOrder: number;
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
    menuSubmenuId: item.menuSubmenuId,
    displayOrder: item.displayOrder,
    size: formatSize(item.size),
  };
}

async function getMenuSubmenuOrThrow(menuSubmenuId: string) {
  const menuSubmenu = await prisma.menuSubmenu.findUnique({
    where: { id: menuSubmenuId },
  });

  if (!menuSubmenu) {
    throw new AppError(404, "Menu submenu not found");
  }

  return menuSubmenu;
}

export async function getCategorySizes(menuSubmenuId: string) {
  await getMenuSubmenuOrThrow(menuSubmenuId);

  const categorySizes = await prisma.categorySize.findMany({
    where: { menuSubmenuId },
    include: { size: true },
    orderBy: [{ displayOrder: "asc" }, { size: { sortOrder: "asc" } }],
  });

  return categorySizes.map(formatCategorySize);
}

export async function addCategorySize(
  menuSubmenuId: string,
  input: { sizeId: string; displayOrder?: number },
) {
  await getMenuSubmenuOrThrow(menuSubmenuId);

  const sizeId = input.sizeId.trim();
  if (!sizeId) {
    throw new AppError(400, "sizeId is required");
  }

  const size = await prisma.size.findUnique({ where: { id: sizeId } });
  if (!size) {
    throw new AppError(404, "Size not found");
  }

  if (
    input.displayOrder !== undefined &&
    (!Number.isInteger(input.displayOrder) || input.displayOrder < 0)
  ) {
    throw new AppError(400, "displayOrder must be a non-negative integer");
  }

  const existing = await prisma.categorySize.findUnique({
    where: {
      menuSubmenuId_sizeId: { menuSubmenuId, sizeId },
    },
  });

  if (existing) {
    throw new AppError(409, "Size is already assigned to this category");
  }

  const categorySize = await prisma.categorySize.create({
    data: {
      menuSubmenuId,
      sizeId,
      displayOrder: input.displayOrder ?? 0,
    },
    include: { size: true },
  });

  return formatCategorySize(categorySize);
}

export async function syncCategorySizes(
  menuSubmenuId: string,
  sizes: Array<{ sizeId: string; displayOrder?: number }>,
) {
  await getMenuSubmenuOrThrow(menuSubmenuId);

  if (!sizes.length) {
    throw new AppError(400, "At least one size is required");
  }

  const normalized = sizes.map((entry, index) => {
    const sizeId = entry.sizeId.trim();
    if (!sizeId) {
      throw new AppError(400, "sizeId is required for each entry");
    }

    const displayOrder =
      entry.displayOrder !== undefined ? entry.displayOrder : index;

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      throw new AppError(400, "displayOrder must be a non-negative integer");
    }

    return { sizeId, displayOrder };
  });

  const uniqueSizeIds = new Set(normalized.map((entry) => entry.sizeId));
  if (uniqueSizeIds.size !== normalized.length) {
    throw new AppError(400, "Duplicate sizeId in request");
  }

  const sizeRecords = await prisma.size.findMany({
    where: { id: { in: [...uniqueSizeIds] } },
  });

  if (sizeRecords.length !== uniqueSizeIds.size) {
    throw new AppError(404, "One or more sizes not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.categorySize.deleteMany({ where: { menuSubmenuId } });

    await tx.categorySize.createMany({
      data: normalized.map((entry) => ({
        menuSubmenuId,
        sizeId: entry.sizeId,
        displayOrder: entry.displayOrder,
      })),
    });
  });

  return getCategorySizes(menuSubmenuId);
}

export async function patchCategorySize(
  menuSubmenuId: string,
  categorySizeId: string,
  input: { displayOrder?: number },
) {
  await getMenuSubmenuOrThrow(menuSubmenuId);

  const existing = await prisma.categorySize.findFirst({
    where: { id: categorySizeId, menuSubmenuId },
    include: { size: true },
  });

  if (!existing) {
    throw new AppError(404, "Category size not found");
  }

  if (input.displayOrder === undefined) {
    throw new AppError(400, "displayOrder is required");
  }

  if (!Number.isInteger(input.displayOrder) || input.displayOrder < 0) {
    throw new AppError(400, "displayOrder must be a non-negative integer");
  }

  const categorySize = await prisma.categorySize.update({
    where: { id: categorySizeId },
    data: { displayOrder: input.displayOrder },
    include: { size: true },
  });

  return formatCategorySize(categorySize);
}

export async function removeCategorySize(
  menuSubmenuId: string,
  categorySizeId: string,
) {
  await getMenuSubmenuOrThrow(menuSubmenuId);

  const existing = await prisma.categorySize.findFirst({
    where: { id: categorySizeId, menuSubmenuId },
    include: { size: true },
  });

  if (!existing) {
    throw new AppError(404, "Category size not found");
  }

  const productSizeCount = await prisma.productSize.count({
    where: {
      sizeId: existing.sizeId,
      product: { menuSubmenuId },
    },
  });

  if (productSizeCount > 0) {
    throw new AppError(
      409,
      "Cannot remove size from category while products use it",
    );
  }

  await prisma.categorySize.delete({ where: { id: categorySizeId } });

  return formatCategorySize(existing);
}
