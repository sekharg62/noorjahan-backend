import { Decimal } from "@prisma/client/runtime/client";

export function toDecimal(value: string | number): Decimal {
  const normalized = typeof value === "string" ? value.trim() : value;

  if (normalized === "" || Number.isNaN(Number(normalized))) {
    throw new Error("Invalid decimal value");
  }

  return new Decimal(normalized);
}

export function formatDecimal(
  value: Decimal | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toFixed(2);
}
