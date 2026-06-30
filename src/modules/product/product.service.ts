import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";
import {
  buildPaginationMeta,
  parsePaginationQuery,
} from "../../utils/pagination";
import { formatDecimal, toDecimal } from "../../utils/decimal";
import type { Decimal } from "@prisma/client/runtime/client";

type DbProduct = {
  id: string;
  menuSubmenuId: string;
  name: string;
  slug: string;
  description: string | null;
  price: Decimal;
  offerPrice: Decimal | null;
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
    price: formatDecimal(item.price)!,
    offerPrice: formatDecimal(item.offerPrice),
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

function formatProductByCategory(
  item: DbProduct & { images: DbProductImage[] },
) {
  return {
    id: item.id,
    menuSubmenuId: item.menuSubmenuId,
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: formatDecimal(item.price)!,
    offerPrice: formatDecimal(item.offerPrice),
    stock: item.stock,
    isActive: item.isActive,
    images: item.images.map((image) => ({
      id: image.id,
      productId: image.productId,
      imgUrl: image.imgUrl,
      displayOrder: image.displayOrder,
      isPrimary: image.isPrimary,
    })),
  };
}

export async function getProductsByCategory(category: string) {
  const slug = slugify(category);

  if (!slug) {
    throw new AppError(400, "category is required");
  }

  const menuSubmenu = await prisma.menuSubmenu.findUnique({
    where: { slug },
  });

  if (!menuSubmenu) {
    throw new AppError(404, "Category not found");
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      menuSubmenu: {
        slug,
      },
    },
    include: {
      images: {
        where: {
          isPrimary: true,
        },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return products.map(formatProductByCategory);
}

type DbMenuSubmenu = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: Date;
};

function formatProductDetail(
  product: DbProduct & {
    images: DbProductImage[];
    menuSubmenu: DbMenuSubmenu;
  },
) {
  return {
    id: product.id,
    menuSubmenuId: product.menuSubmenuId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    offerPrice: product.offerPrice,
    stock: product.stock,
    isActive: product.isActive,
    images: product.images.map((image) => ({
      id: image.id,
      productId: image.productId,
      imgUrl: image.imgUrl,
      displayOrder: image.displayOrder,
      isPrimary: image.isPrimary,
    })),
    menuSubmenu: {
      id: product.menuSubmenu.id,
      name: product.menuSubmenu.name,
      slug: product.menuSubmenu.slug,
      parentId: product.menuSubmenu.parentId,
    },
  };
}

export async function getProductBySlug(slug: string) {
  const normalizedSlug = slugify(slug);

  if (!normalizedSlug) {
    throw new AppError(400, "Product slug is required");
  }

  const product = await prisma.product.findUnique({
    where: {
      slug: normalizedSlug,
    },
    include: {
      images: {
        orderBy: {
          displayOrder: "asc",
        },
      },
      menuSubmenu: true,
    },
  });

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  return formatProductDetail(product);
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

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<void> {
  const existing = await prisma.product.findUnique({
    where: { slug },
  });

  if (existing && existing.id !== excludeId) {
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
  const price = toDecimal(input.price);
  const offerPrice = input.offerPrice?.trim()
    ? toDecimal(input.offerPrice)
    : null;

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

  try {
    toDecimal(input.price);
  } catch {
    throw new AppError(400, "price must be a valid number");
  }

  if (input.offerPrice?.trim()) {
    try {
      toDecimal(input.offerPrice);
    } catch {
      throw new AppError(400, "offerPrice must be a valid number");
    }
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

export async function patchProduct(
  id: string,
  input: {
    menuSubmenuId?: string;
    name?: string;
    slug?: string;
    description?: string;
    price?: string;
    offerPrice?: string | null;
    stock?: number;
    isActive?: boolean;
  },
) {
  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Product not found");
  }

  if (
    input.menuSubmenuId === undefined &&
    input.name === undefined &&
    input.slug === undefined &&
    input.description === undefined &&
    input.price === undefined &&
    input.offerPrice === undefined &&
    input.stock === undefined &&
    input.isActive === undefined
  ) {
    throw new AppError(400, "At least one field is required to update");
  }

  const data: {
    menuSubmenuId?: string;
    name?: string;
    slug?: string;
    description?: string;
    price?: Decimal;
    offerPrice?: Decimal | null;
    stock?: number;
    isActive?: boolean;
  } = {};

  if (input.menuSubmenuId !== undefined) {
    const menuSubmenuId = input.menuSubmenuId.trim();

    if (!menuSubmenuId) {
      throw new AppError(400, "menuSubmenuId cannot be empty");
    }

    const menuSubmenu = await prisma.menuSubmenu.findUnique({
      where: { id: menuSubmenuId },
    });

    if (!menuSubmenu) {
      throw new AppError(404, "Menu submenu not found");
    }

    data.menuSubmenuId = menuSubmenuId;
  }

  if (input.name !== undefined) {
    const name = input.name.trim();

    if (!name) {
      throw new AppError(400, "name cannot be empty");
    }

    data.name = name;
  }

  if (input.slug !== undefined) {
    const slug = slugify(input.slug);

    if (!slug) {
      throw new AppError(400, "slug is required");
    }

    await ensureUniqueSlug(slug, id);
    data.slug = slug;
  }

  if (input.description !== undefined) {
    const description = input.description.trim();

    if (!description) {
      throw new AppError(400, "description cannot be empty");
    }

    data.description = description;
  }

  if (input.price !== undefined) {
    try {
      data.price = toDecimal(input.price);
    } catch {
      throw new AppError(400, "price must be a valid number");
    }
  }

  if (input.offerPrice !== undefined) {
    if (input.offerPrice === null || !input.offerPrice.trim()) {
      data.offerPrice = null;
    } else {
      try {
        data.offerPrice = toDecimal(input.offerPrice);
      } catch {
        throw new AppError(400, "offerPrice must be a valid number");
      }
    }
  }

  if (input.stock !== undefined) {
    if (!Number.isInteger(input.stock) || input.stock < 0) {
      throw new AppError(400, "stock must be a non-negative integer");
    }

    data.stock = input.stock;
  }

  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  return formatProduct(product);
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Product not found");
  }

  const orderItemCount = await prisma.orderItem.count({
    where: { productId: id },
  });

  if (orderItemCount > 0) {
    throw new AppError(
      409,
      "Cannot delete product that has been ordered",
    );
  }

  await prisma.product.delete({ where: { id } });

  return formatProduct(existing);
}
