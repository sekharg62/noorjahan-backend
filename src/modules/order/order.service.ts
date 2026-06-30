import {
  OrderStatus,
  PaymentMethod,
  type Order,
  type OrderItem,
  type Product,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/client";
import { prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";
import { formatDecimal } from "../../utils/decimal";
import { generateOrderNo } from "../../utils/orderNo";
import {
  buildPaginationMeta,
  parsePaginationQuery,
} from "../../utils/pagination";

const PAYMENT_METHODS = new Set<string>(Object.values(PaymentMethod));
const ORDER_STATUSES = new Set<string>(Object.values(OrderStatus));

interface OrderItemInput {
  productId: string;
  quantity: number;
  size?: string;
}

interface GuestInput {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  pincode: string;
}

interface PlaceOrderInput {
  customerId?: string;
  addressId?: string;
  guest?: GuestInput;
  paymentMethod: string;
  items: OrderItemInput[];
}

type OrderWithRelations = Order & {
  items: (OrderItem & { product: Product })[];
  address: {
    id: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    alternativePh: string | null;
    notes: string | null;
  } | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
};

function parsePaymentMethod(value: string): PaymentMethod {
  const method = value.toUpperCase();

  if (!PAYMENT_METHODS.has(method)) {
    throw new AppError(400, "paymentMethod must be COD or ONLINE");
  }

  return method as PaymentMethod;
}

function parseOrderStatus(value: string): OrderStatus {
  const status = value.toUpperCase();

  if (!ORDER_STATUSES.has(status)) {
    throw new AppError(400, "Invalid order status");
  }

  return status as OrderStatus;
}

function getUnitPrice(product: Product): Decimal {
  return product.offerPrice ?? product.price;
}

function calculateShipping(subtotal: Decimal): Decimal {
  const freeShippingThreshold = new Decimal(500);
  return subtotal.gte(freeShippingThreshold) ? new Decimal(0) : new Decimal(50);
}

function formatOrderItem(item: OrderItem & { product: Product }) {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    productSlug: item.product.slug,
    quantity: item.quantity,
    size: item.size,
    price: formatDecimal(item.price),
  };
}

function formatOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    orderNo: order.orderNo,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: formatDecimal(order.subtotal),
    shipping: formatDecimal(order.shipping),
    total: formatDecimal(order.total),
    customer: order.customer
      ? {
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
          email: order.customer.email,
        }
      : null,
    address: order.address
      ? {
          id: order.address.id,
          fullName: order.address.fullName,
          phone: order.address.phone,
          address: order.address.address,
          city: order.address.city,
          pincode: order.address.pincode,
          alternativePh: order.address.alternativePh,
          notes: order.address.notes,
        }
      : null,
    guest:
      !order.customerId && order.guestName
        ? {
            name: order.guestName,
            phone: order.guestPhone,
            email: order.guestEmail,
            address: order.guestAddress,
            city: order.guestCity,
            pincode: order.guestPincode,
          }
        : null,
    items: order.items.map(formatOrderItem),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function validateItems(items: OrderItemInput[]): OrderItemInput[] {
  if (!items.length) {
    throw new AppError(400, "At least one order item is required");
  }

  return items.map((item) => {
    if (!item.productId?.trim()) {
      throw new AppError(400, "productId is required for each item");
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new AppError(400, "quantity must be a positive integer");
    }

    return {
      productId: item.productId.trim(),
      quantity: item.quantity,
      size: item.size?.trim() || undefined,
    };
  });
}

export async function placeOrder(input: PlaceOrderInput) {
  const items = validateItems(input.items);
  const paymentMethod = parsePaymentMethod(input.paymentMethod);
  const isGuestOrder = Boolean(input.guest);
  const isLoggedInOrder = Boolean(input.customerId);

  if (isGuestOrder === isLoggedInOrder) {
    throw new AppError(
      400,
      "Provide either guest details or a saved address for logged-in checkout",
    );
  }

  if (isLoggedInOrder) {
    if (!input.addressId?.trim()) {
      throw new AppError(400, "addressId is required for logged-in checkout");
    }

    const address = await prisma.customerAddress.findFirst({
      where: {
        id: input.addressId,
        customerId: input.customerId,
      },
    });

    if (!address) {
      throw new AppError(404, "Address not found");
    }
  }

  if (isGuestOrder && input.guest) {
    const guest = input.guest;

    if (!guest.name?.trim()) throw new AppError(400, "guest.name is required");
    if (!guest.phone?.trim()) throw new AppError(400, "guest.phone is required");
    if (!guest.address?.trim()) {
      throw new AppError(400, "guest.address is required");
    }
    if (!guest.city?.trim()) throw new AppError(400, "guest.city is required");
    if (!guest.pincode?.trim()) {
      throw new AppError(400, "guest.pincode is required");
    }
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError(404, "One or more products not found or inactive");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  let subtotal = new Decimal(0);
  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId)!;

    if (product.stock < item.quantity) {
      throw new AppError(
        400,
        `Insufficient stock for product: ${product.name}`,
      );
    }

    const unitPrice = getUnitPrice(product);
    const lineTotal = unitPrice.mul(item.quantity);
    subtotal = subtotal.add(lineTotal);

    return {
      productId: product.id,
      quantity: item.quantity,
      size: item.size,
      price: unitPrice,
    };
  });

  const shipping = calculateShipping(subtotal);
  const total = subtotal.add(shipping);

  const order = await prisma.$transaction(async (tx) => {
    let orderNo = generateOrderNo();
    let existing = await tx.order.findUnique({ where: { orderNo } });

    while (existing) {
      orderNo = generateOrderNo();
      existing = await tx.order.findUnique({ where: { orderNo } });
    }

    for (const item of lineItems) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.quantity },
        },
        data: {
          stock: { decrement: item.quantity },
        },
      });

      if (updated.count === 0) {
        throw new AppError(400, "Insufficient stock for one or more products");
      }
    }

    return tx.order.create({
      data: {
        orderNo,
        customerId: input.customerId ?? null,
        addressId: input.addressId ?? null,
        guestName: input.guest?.name.trim() ?? null,
        guestPhone: input.guest?.phone.trim() ?? null,
        guestEmail: input.guest?.email?.trim() || null,
        guestAddress: input.guest?.address.trim() ?? null,
        guestCity: input.guest?.city.trim() ?? null,
        guestPincode: input.guest?.pincode.trim() ?? null,
        paymentMethod,
        status: OrderStatus.PENDING,
        subtotal,
        shipping,
        total,
        items: {
          create: lineItems,
        },
      },
      include: {
        items: { include: { product: true } },
        address: true,
        customer: true,
      },
    });
  });

  return {
    orderNo: order.orderNo,
    order: formatOrder(order),
  };
}

export async function getOrderByOrderNo(orderNo: string) {
  const normalizedOrderNo = orderNo.trim().toUpperCase();

  if (!normalizedOrderNo) {
    throw new AppError(400, "orderNo is required");
  }

  const order = await prisma.order.findUnique({
    where: { orderNo: normalizedOrderNo },
    include: {
      items: { include: { product: true } },
      address: true,
      customer: true,
    },
  });

  if (!order) {
    throw new AppError(404, "Order not found");
  }

  return formatOrder(order);
}

export async function getCustomerOrders(customerId: string) {
  const orders = await prisma.order.findMany({
    where: { customerId },
    include: {
      items: { include: { product: true } },
      address: true,
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => formatOrder(order));
}

export async function getAdminOrders(query?: {
  page?: string;
  limit?: string;
  status?: string;
  orderNo?: string;
}) {
  const { page, limit, skip } = parsePaginationQuery({
    page: query?.page,
    limit: query?.limit,
  });

  const where: {
    status?: OrderStatus;
    orderNo?: { contains: string };
  } = {};

  if (query?.status?.trim()) {
    where.status = parseOrderStatus(query.status);
  }

  if (query?.orderNo?.trim()) {
    where.orderNo = {
      contains: query.orderNo.trim().toUpperCase(),
    };
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        address: true,
        customer: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    orders: orders.map((order) => formatOrder(order)),
    pagination: buildPaginationMeta(total, { page, limit }),
  };
}

export async function updateOrderStatus(id: string, status: string) {
  const existing = await prisma.order.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, "Order not found");
  }

  const nextStatus = parseOrderStatus(status);

  const order = await prisma.order.update({
    where: { id },
    data: { status: nextStatus },
    include: {
      items: { include: { product: true } },
      address: true,
      customer: true,
    },
  });

  return formatOrder(order);
}
