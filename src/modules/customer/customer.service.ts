import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";
import { formatDecimal } from "../../utils/decimal";
import { formatAddress } from "./address/address.service";
import { getCustomerOrders } from "../order/order.service";

export async function getCustomerProfile(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      createdAt: true,
    },
  });

  if (!customer) {
    throw new AppError(404, "Customer not found");
  }

  const [orderStats, orders, addresses] = await Promise.all([
    prisma.order.aggregate({
      where: { customerId },
      _count: { id: true },
      _sum: { total: true },
    }),
    getCustomerOrders(customerId),
    prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      createdAt: customer.createdAt.toISOString(),
    },
    orders: {
      total: orderStats._count.id,
      totalAmount: formatDecimal(orderStats._sum.total) ?? "0.00",
      list: orders,
    },
    addresses: {
      total: addresses.length,
      list: addresses.map(formatAddress),
    },
  };
}
