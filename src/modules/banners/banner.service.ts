import { BannerType } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

const BANNER_TYPES = new Set<string>(Object.values(BannerType));

type DbBanner = {
  id: string;
  imgUrl: string;
  redirectUrl: string | null;
  order: number;
  type: BannerType;
  createdAt: Date;
};

function normalizeRedirectUrl(redirectUrl?: string | null): string | null {
  if (redirectUrl === undefined || redirectUrl === null) {
    return null;
  }

  const value = redirectUrl.trim();
  return value || null;
}

function formatBanner(item: DbBanner) {
  return {
    id: item.id,
    imgUrl: item.imgUrl,
    redirectUrl: item.redirectUrl,
    order: item.order,
    type: item.type,
    createdAt: item.createdAt.toISOString(),
  };
}

function parseBannerType(type?: string): BannerType {
  const value = (type ?? "HOME").toUpperCase();

  if (!BANNER_TYPES.has(value)) {
    throw new AppError(400, "Type must be HOME, CATEGORY, or PRODUCT");
  }

  return value as BannerType;
}

async function ensureUniqueOrder(order: number, excludeId?: string): Promise<void> {
  const existing = await prisma.banner.findUnique({
    where: { order },
  });

  if (existing && existing.id !== excludeId) {
    throw new AppError(409, "Order already exists");
  }
}

export async function getAllBanners(type?: string) {
  const bannerType = type ? parseBannerType(type) : undefined;

  const items = await prisma.banner.findMany({
    where: bannerType ? { type: bannerType } : undefined,
    orderBy: { order: "asc" },
  });

  return items.map(formatBanner);
}

interface CreateBannerInput {
  imgUrl: string;
  redirectUrl?: string | null;
  order: number;
  type?: string;
}

export async function createBanner(input: CreateBannerInput) {
  const imgUrl = input.imgUrl.trim();
  const redirectUrl = normalizeRedirectUrl(input.redirectUrl);

  if (!imgUrl) {
    throw new AppError(400, "imgUrl is required");
  }

  if (!Number.isInteger(input.order) || input.order < 0) {
    throw new AppError(400, "order must be a non-negative integer");
  }

  const type = parseBannerType(input.type);
  await ensureUniqueOrder(input.order);

  const banner = await prisma.banner.create({
    data: {
      imgUrl,
      redirectUrl,
      order: input.order,
      type,
    },
  });

  return formatBanner(banner);
}

interface UpdateBannerInput {
  imgUrl: string;
  redirectUrl?: string | null;
  order: number;
  type?: string;
}

export async function updateBanner(id: string, input: UpdateBannerInput) {
  const existing = await prisma.banner.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Banner not found");
  }

  const imgUrl = input.imgUrl.trim();
  const redirectUrl =
    input.redirectUrl !== undefined
      ? normalizeRedirectUrl(input.redirectUrl)
      : existing.redirectUrl;

  if (!imgUrl) {
    throw new AppError(400, "imgUrl is required");
  }

  if (!Number.isInteger(input.order) || input.order < 0) {
    throw new AppError(400, "order must be a non-negative integer");
  }

  const type = parseBannerType(input.type);
  await ensureUniqueOrder(input.order, id);

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      imgUrl,
      redirectUrl,
      order: input.order,
      type,
    },
  });

  return formatBanner(banner);
}

export async function deleteBanner(id: string) {
  const existing = await prisma.banner.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Banner not found");
  }

  await prisma.banner.delete({ where: { id } });

  return formatBanner(existing);
}
