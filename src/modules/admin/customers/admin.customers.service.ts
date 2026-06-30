import { prisma } from "../../../config/database";
import {
  buildPaginationMeta,
  parsePaginationQuery,
} from "../../../utils/pagination";

function formatAdminCustomer(customer: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: Date;
  _count: {
    orders: number;
    addresses: number;
  };
}) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    totalOrders: customer._count.orders,
    totalAddresses: customer._count.addresses,
    createdAt: customer.createdAt.toISOString(),
  };
}

export async function getAdminCustomers(query?: {
  page?: string;
  limit?: string;
  search?: string;
}) {
  const { page, limit, skip } = parsePaginationQuery({
    page: query?.page,
    limit: query?.limit,
  });

  const search = query?.search?.trim();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    customers: customers.map(formatAdminCustomer),
    pagination: buildPaginationMeta(total, { page, limit }),
  };
}
