import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";
import {
  buildPaginationMeta,
  parsePaginationQuery,
} from "../../utils/pagination";

interface MenuSubmenuRecord {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: string;
}

interface MenuSubmenuWithChildren extends MenuSubmenuRecord {
  children: MenuSubmenuRecord[];
}

type DbMenuSubmenu = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: Date;
};

function formatItem(item: DbMenuSubmenu): MenuSubmenuRecord {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    parentId: item.parentId,
    createdAt: item.createdAt.toISOString(),
  };
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function validateParentId(
  parentId: string | null | undefined,
  currentId?: string,
): Promise<string | null> {
  if (parentId === undefined || parentId === null || parentId === "") {
    return null;
  }

  if (currentId && parentId === currentId) {
    throw new AppError(400, "An item cannot be its own parent");
  }

  const parent = await prisma.menuSubmenu.findUnique({
    where: { id: parentId },
  });

  if (!parent) {
    throw new AppError(404, "Parent menu not found");
  }

  if (parent.parentId) {
    throw new AppError(400, "Parent must be a top-level menu item");
  }

  return parentId;
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<void> {
  const existing = await prisma.menuSubmenu.findUnique({
    where: { slug },
  });

  if (existing && existing.id !== excludeId) {
    throw new AppError(409, "Slug already exists");
  }
}

export async function getAllMenuSubmenus(query?: {
  page?: string;
  limit?: string;
}) {
  const { page, limit, skip } = parsePaginationQuery({
    page: query?.page,
    limit: query?.limit,
  });

  const where = { parentId: null };

  const [total, menus] = await Promise.all([
    prisma.menuSubmenu.count({ where }),
    prisma.menuSubmenu.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      include: {
        children: {
          orderBy: { name: "asc" },
        },
      },
    }),
  ]);

  const data: MenuSubmenuWithChildren[] = menus.map((menu) => ({
    ...formatItem(menu),
    children: menu.children.map(formatItem),
  }));

  const flat = data.flatMap((menu) => [
    {
      id: menu.id,
      name: menu.name,
      slug: menu.slug,
      parentId: menu.parentId,
      createdAt: menu.createdAt,
    },
    ...menu.children,
  ]);

  return {
    menus: data,
    flat,
    pagination: buildPaginationMeta(total, { page, limit }),
  };
}

export async function getMenuSubmenuById(id: string) {
  const item = await prisma.menuSubmenu.findUnique({
    where: { id },
    include: {
      children: {
        orderBy: { name: "asc" },
      },
      parent: true,
    },
  });

  if (!item) {
    throw new AppError(404, "Menu item not found");
  }

  return {
    ...formatItem(item),
    parent: item.parent ? formatItem(item.parent) : null,
    children: item.children.map(formatItem),
  };
}

interface CreateMenuSubmenuInput {
  name: string;
  slug?: string;
  parentId?: string | null;
}

export async function createMenuSubmenu(input: CreateMenuSubmenuInput) {
  const name = input.name.trim();

  if (!name) {
    throw new AppError(400, "Name is required");
  }

  const slug = slugify(input.slug ?? name);

  if (!slug) {
    throw new AppError(400, "Valid slug is required");
  }

  const parentId = await validateParentId(input.parentId);
  await ensureUniqueSlug(slug);

  const item = await prisma.menuSubmenu.create({
    data: {
      name,
      slug,
      parentId,
    },
  });

  return formatItem(item);
}

interface UpdateMenuSubmenuInput {
  name: string;
  slug: string;
  parentId?: string | null;
}

export async function updateMenuSubmenu(id: string, input: UpdateMenuSubmenuInput) {
  const existing = await prisma.menuSubmenu.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Menu item not found");
  }

  const name = input.name.trim();
  const slug = slugify(input.slug);

  if (!name) {
    throw new AppError(400, "Name is required");
  }

  if (!slug) {
    throw new AppError(400, "Valid slug is required");
  }

  const parentId = await validateParentId(input.parentId, id);
  await ensureUniqueSlug(slug, id);

  const item = await prisma.menuSubmenu.update({
    where: { id },
    data: {
      name,
      slug,
      parentId,
    },
  });

  return formatItem(item);
}

interface PatchMenuSubmenuInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
}

export async function patchMenuSubmenu(id: string, input: PatchMenuSubmenuInput) {
  const existing = await prisma.menuSubmenu.findUnique({
    where: { id },
    include: { children: true },
  });

  if (!existing) {
    throw new AppError(404, "Menu item not found");
  }

  if (
    input.name === undefined &&
    input.slug === undefined &&
    input.parentId === undefined
  ) {
    throw new AppError(400, "At least one field is required to update");
  }

  const name =
    input.name !== undefined ? input.name.trim() : existing.name;
  const slug =
    input.slug !== undefined ? slugify(input.slug) : existing.slug;
  const parentId =
    input.parentId !== undefined
      ? await validateParentId(input.parentId, id)
      : existing.parentId;

  if (!name) {
    throw new AppError(400, "Name cannot be empty");
  }

  if (!slug) {
    throw new AppError(400, "Valid slug is required");
  }

  if (existing.children.length > 0 && parentId) {
    throw new AppError(400, "A menu with submenus cannot become a submenu");
  }

  await ensureUniqueSlug(slug, id);

  const item = await prisma.menuSubmenu.update({
    where: { id },
    data: {
      name,
      slug,
      parentId,
    },
  });

  return formatItem(item);
}

export async function deleteMenuSubmenu(id: string) {
  const existing = await prisma.menuSubmenu.findUnique({
    where: { id },
    include: {
      children: { select: { id: true } },
      products: { select: { id: true } },
    },
  });

  if (!existing) {
    throw new AppError(404, "Menu item not found");
  }

  if (existing.children.length > 0) {
    throw new AppError(400, "Cannot delete menu item that has submenus");
  }

  if (existing.products.length > 0) {
    const orderedProductCount = await prisma.orderItem.count({
      where: {
        productId: { in: existing.products.map((product) => product.id) },
      },
    });

    if (orderedProductCount > 0) {
      throw new AppError(
        409,
        "Cannot delete category with products that have been ordered",
      );
    }

    throw new AppError(
      409,
      "Cannot delete category that has products. Delete products first",
    );
  }

  await prisma.menuSubmenu.delete({ where: { id } });

  return formatItem(existing);
}
