import { AppError } from "../middleware/errorHandler";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function parsePaginationQuery(query: {
  page?: string;
  limit?: string;
}): PaginationParams {
  const pageValue = query.page ? Number(query.page) : 1;
  const limitValue = query.limit ? Number(query.limit) : 10;

  if (!Number.isInteger(pageValue) || pageValue < 1) {
    throw new AppError(400, "page must be a positive integer");
  }

  if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 100) {
    throw new AppError(400, "limit must be an integer between 1 and 100");
  }

  return {
    page: pageValue,
    limit: limitValue,
    skip: (pageValue - 1) * limitValue,
  };
}

export function buildPaginationMeta(
  total: number,
  params: Pick<PaginationParams, "page" | "limit">,
): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / params.limit);

  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPrevPage: params.page > 1,
  };
}
