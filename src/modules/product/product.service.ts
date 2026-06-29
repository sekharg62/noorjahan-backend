import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";
import {
  buildPaginationMeta,
  parsePaginationQuery,
} from "../../utils/pagination";

type DbProduct = {
  id: string;
  menuSubmenuId: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  offerPrice: string | null;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

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

function formatProduct(item: DbProduct) {
  return {
    id: item.id,
    menuSubmenuId: item.menuSubmenuId,
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: item.price,
    offerPrice: item.offerPrice,
    stock: item.stock,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function formatProductWithImages(
  item: DbProduct & { images: DbProductImage[] },
) {
  return {
    ...formatProduct(item),
    images: item.images.map(formatProductImage),
  };
}

async function buildProductFilter(menuId?: string, submenuId?: string) {
  if (submenuId) {
    const submenu = await prisma.menuSubmenu.findUnique({
      where: { id: submenuId },
    });

    if (!submenu) {
      throw new AppError(404, "Submenu not found");
    }

    if (menuId && submenu.parentId !== menuId) {
      throw new AppError(400, "Submenu does not belong to the specified menu");
    }

    return { menuSubmenuId: submenuId };
  }

  if (menuId) {
    const menu = await prisma.menuSubmenu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      throw new AppError(404, "Menu not found");
    }

    if (menu.parentId !== null) {
      throw new AppError(400, "menuId must be a top-level menu");
    }

    return {
      menuSubmenu: {
        parentId: menuId,
      },
    };
  }

  return {};
}

export async function getAllProducts(query?: {
  page?: string;
  limit?: string;
  menuId?: string;
  submenuId?: string;
}) {
  const { page, limit, skip } = parsePaginationQuery({
    page: query?.page,
    limit: query?.limit,
  });

  const where = await buildProductFilter(query?.menuId, query?.submenuId);

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        images: {
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
  ]);

  return {
    products: products.map(formatProductWithImages),
    pagination: buildPaginationMeta(total, { page, limit }),
  };
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniqueSlug(slug: string): Promise<void> {
  const existing = await prisma.product.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new AppError(409, "Slug already exists");
  }
}

interface CreateProductInput {
  menuSubmenuId: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  offerPrice?: string;
  stock?: number;
  isActive?: boolean;
}

export async function createProduct(input: CreateProductInput) {
  const menuSubmenuId = input.menuSubmenuId.trim();
  const name = input.name.trim();
  const slug = slugify(input.slug);
  const description = input.description.trim();
  const price = input.price.trim();
  const offerPrice = input.offerPrice?.trim() || null;

  if (!menuSubmenuId) {
    throw new AppError(400, "menuSubmenuId is required");
  }

  if (!name) {
    throw new AppError(400, "name is required");
  }

  if (!slug) {
    throw new AppError(400, "slug is required");
  }

  if (!description) {
    throw new AppError(400, "description is required");
  }

  if (!price) {
    throw new AppError(400, "price is required");
  }

  if (
    input.stock !== undefined &&
    (!Number.isInteger(input.stock) || input.stock < 0)
  ) {
    throw new AppError(400, "stock must be a non-negative integer");
  }

  const menuSubmenu = await prisma.menuSubmenu.findUnique({
    where: { id: menuSubmenuId },
  });

  if (!menuSubmenu) {
    throw new AppError(404, "Menu submenu not found");
  }

  await ensureUniqueSlug(slug);

  const product = await prisma.product.create({
    data: {
      menuSubmenuId,
      name,
      slug,
      description,
      price,
      offerPrice,
      stock: input.stock ?? 0,
      isActive: input.isActive ?? true,
    },
  });

  return formatProduct(product);
}
