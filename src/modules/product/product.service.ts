import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";
import type { Prisma } from "@prisma/client";
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
  isActive: boolean;
  showHomePage: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type DbSize = {
  id: string;
  label: string;
  sortOrder: number;
  description: string | null;
};

type DbProductSize = {
  id: string;
  stock: number;
  sku: string | null;
  size: DbSize;
};

const productSizesInclude = {
  productSizes: {
    include: { size: true },
    orderBy: { size: { sortOrder: "asc" as const } },
  },
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

function formatProductSize(item: DbProductSize) {
  return {
    id: item.id,
    sizeId: item.size.id,
    label: item.size.label,
    sortOrder: item.size.sortOrder,
    description: item.size.description,
    stock: item.stock,
    sku: item.sku,
  };
}

function formatSizesSummary(productSizes: DbProductSize[]) {
  const sizes = productSizes.map(formatProductSize);
  const totalStock = sizes.reduce((sum, size) => sum + size.stock, 0);

  return { sizes, totalStock };
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
    isActive: item.isActive,
    showHomePage: item.showHomePage,
    sizes: [] as ReturnType<typeof formatProductSize>[],
    totalStock: 0,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function formatProductWithImages(
  item: DbProduct & {
    images: DbProductImage[];
    productSizes: DbProductSize[];
  },
) {
  const { sizes, totalStock } = formatSizesSummary(item.productSizes);

  return {
    ...formatProduct(item),
    sizes,
    totalStock,
    images: item.images.map(formatProductImage),
  };
}

function formatProductByCategory(
  item: DbProduct & {
    images: DbProductImage[];
    productSizes: DbProductSize[];
  },
) {
  const { sizes, totalStock } = formatSizesSummary(item.productSizes);

  return {
    id: item.id,
    menuSubmenuId: item.menuSubmenuId,
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: formatDecimal(item.price)!,
    offerPrice: formatDecimal(item.offerPrice),
    isActive: item.isActive,
    showHomePage: item.showHomePage,
    sizes,
    totalStock,
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
      ...productSizesInclude,
    },
    orderBy: { name: "asc" },
  });

  return products.map(formatProductByCategory);
}

function formatSearchProduct(
  item: DbProduct & {
    images: DbProductImage[];
    productSizes: DbProductSize[];
    menuSubmenu: DbMenuSubmenu & { parent: DbMenuSubmenu | null };
  },
) {
  const primaryImage = item.images[0] ?? null;
  const { sizes, totalStock } = formatSizesSummary(item.productSizes);

  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    price: formatDecimal(item.price)!,
    offerPrice: formatDecimal(item.offerPrice),
    sizes,
    totalStock,
    category: {
      id: item.menuSubmenu.id,
      name: item.menuSubmenu.name,
      slug: item.menuSubmenu.slug,
      parent: item.menuSubmenu.parent
        ? {
            id: item.menuSubmenu.parent.id,
            name: item.menuSubmenu.parent.name,
            slug: item.menuSubmenu.parent.slug,
          }
        : null,
    },
    primaryImage: primaryImage
      ? {
          id: primaryImage.id,
          imgUrl: primaryImage.imgUrl,
          displayOrder: primaryImage.displayOrder,
          isPrimary: primaryImage.isPrimary,
        }
      : null,
  };
}

export async function searchProducts(query: string) {
  const search = query.trim();

  if (!search) {
    throw new AppError(400, "q is required");
  }

  const slugSearch = slugify(search);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: slugSearch, mode: "insensitive" } },
        { menuSubmenu: { name: { contains: search, mode: "insensitive" } } },
        ...(slugSearch
          ? [{ menuSubmenu: { slug: { contains: slugSearch } } }]
          : []),
        {
          menuSubmenu: {
            parent: { name: { contains: search, mode: "insensitive" } },
          },
        },
        ...(slugSearch
          ? [
              {
                menuSubmenu: {
                  parent: { slug: { contains: slugSearch } },
                },
              },
            ]
          : []),
      ],
    },
    include: {
      menuSubmenu: {
        include: {
          parent: true,
        },
      },
      images: {
        where: {
          isPrimary: true,
        },
        take: 1,
      },
      ...productSizesInclude,
    },
    orderBy: { name: "asc" },
  });

  return products.map(formatSearchProduct);
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
    productSizes: DbProductSize[];
    menuSubmenu: DbMenuSubmenu & {
      categorySizes: Array<{
        displayOrder: number;
        size: DbSize;
      }>;
    };
  },
) {
  const { sizes, totalStock } = formatSizesSummary(product.productSizes);

  return {
    id: product.id,
    menuSubmenuId: product.menuSubmenuId,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: formatDecimal(product.price)!,
    offerPrice: formatDecimal(product.offerPrice),
    isActive: product.isActive,
    showHomePage: product.showHomePage,
    sizes,
    totalStock,
    images: product.images.map((image) => ({
      id: image.id,
      productId: image.productId,
      imgUrl: image.imgUrl,
      displayOrder: image.displayOrder,
      isPrimary: image.isPrimary,
    })),
    categorySizes: product.menuSubmenu.categorySizes.map((categorySize) => ({
      sizeId: categorySize.size.id,
      label: categorySize.size.label,
      sortOrder: categorySize.size.sortOrder,
      description: categorySize.size.description,
      displayOrder: categorySize.displayOrder,
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
      menuSubmenu: {
        include: {
          categorySizes: {
            include: { size: true },
            orderBy: { displayOrder: "asc" },
          },
        },
      },
      ...productSizesInclude,
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

function parseShowHomeQuery(value?: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new AppError(400, "showHome must be true or false");
}

export async function getAllProducts(query?: {
  page?: string;
  limit?: string;
  menuId?: string;
  submenuId?: string;
  showHome?: string;
}) {
  const { page, limit, skip } = parsePaginationQuery({
    page: query?.page,
    limit: query?.limit,
  });

  const showHome = parseShowHomeQuery(query?.showHome);
  const where = {
    ...(await buildProductFilter(query?.menuId, query?.submenuId)),
    ...(showHome === true
      ? { showHomePage: true, isActive: true }
      : showHome === false
        ? { showHomePage: false }
        : {}),
  };

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
        ...productSizesInclude,
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
  isActive?: boolean;
  showHomePage?: boolean;
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

  if (
    input.offerPrice?.trim()
  ) {
    try {
      toDecimal(input.offerPrice);
    } catch {
      throw new AppError(400, "offerPrice must be a valid number");
    }
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
      isActive: input.isActive ?? true,
      showHomePage: input.showHomePage ?? false,
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
    isActive?: boolean;
    showHomePage?: boolean;
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
    input.isActive === undefined &&
    input.showHomePage === undefined
  ) {
    throw new AppError(400, "At least one field is required to update");
  }

  const data: Prisma.ProductUpdateInput = {};

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

    data.menuSubmenu = { connect: { id: menuSubmenuId } };
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

  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }

  if (input.showHomePage !== undefined) {
    data.showHomePage = input.showHomePage;
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
