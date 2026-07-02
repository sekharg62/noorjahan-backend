import { OrderStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";
import { formatDecimal } from "../../utils/decimal";

function parseDateParam(value: string, fieldName: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, `${fieldName} must be in YYYY-MM-DD format`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `${fieldName} is invalid`);
  }

  return date;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function listDatesInRange(from: Date, to: Date): string[] {
  const dates: string[] = [];
  const current = new Date(from);

  while (current <= to) {
    dates.push(toDateKey(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export async function getDashboardStats() {
  const [
    totalMenuItems,
    totalSubmenuItems,
    totalProducts,
    totalProductImages,
    totalOrders,
    totalCustomers,
  ] = await Promise.all([
    prisma.menuSubmenu.count({ where: { parentId: null } }),
    prisma.menuSubmenu.count({ where: { parentId: { not: null } } }),
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.order.count(),
    prisma.customer.count(),
  ]);

  return {
    totalMenuItems,
    totalSubmenuItems,
    totalProducts,
    totalProductImages,
    totalOrders,
    totalCustomers,
  };
}

export async function getSalesByDateRange(from: string, to: string) {
  const fromDate = parseDateParam(from, "from");
  const toDate = parseDateParam(to, "to");

  if (fromDate > toDate) {
    throw new AppError(400, "from date cannot be after to date");
  }

  const rangeEnd = new Date(toDate);
  rangeEnd.setUTCHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: fromDate,
        lte: rangeEnd,
      },
      status: {
        not: OrderStatus.CANCELLED,
      },
    },
    select: {
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const salesByDate = new Map<string, { totalSales: Decimal; orderCount: number }>();

  for (const order of orders) {
    const date = toDateKey(order.createdAt);
    const existing = salesByDate.get(date) ?? {
      totalSales: new Decimal(0),
      orderCount: 0,
    };

    existing.totalSales = existing.totalSales.add(order.total);
    existing.orderCount += 1;
    salesByDate.set(date, existing);
  }

  const sales = listDatesInRange(fromDate, toDate).map((date) => {
    const entry = salesByDate.get(date);

    return {
      date,
      totalSales: formatDecimal(entry?.totalSales ?? new Decimal(0))!,
      orderCount: entry?.orderCount ?? 0,
    };
  });

  return {
    from,
    to,
    totalSales: formatDecimal(
      orders.reduce((sum, order) => sum.add(order.total), new Decimal(0)),
    )!,
    totalOrders: orders.length,
    sales,
  };
}
