import { prisma } from "../config/database";

const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderNo(): string {
  let orderNo = "";

  for (let i = 0; i < 10; i++) {
    orderNo += chars[Math.floor(Math.random() * chars.length)];
  }

  return orderNo;
}

export async function generateUniqueOrderNo(): Promise<string> {
  let orderNo: string;

  do {
    orderNo = generateOrderNo();
  } while (
    await prisma.order.findUnique({
      where: { orderNo },
    })
  );

  return orderNo;
}
