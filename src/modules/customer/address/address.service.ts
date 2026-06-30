import { prisma } from "../../../config/database";
import { AppError } from "../../../middleware/errorHandler";

interface AddressInput {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  alternativePh?: string | null;
  notes?: string | null;
}

type AddressUpdateInput = Partial<AddressInput>;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits;
}

function validatePhone(phone: string, fieldName = "phone"): string {
  const normalized = normalizePhone(phone);

  if (!/^\d{10}$/.test(normalized)) {
    throw new AppError(400, `${fieldName} must be a valid 10-digit number`);
  }

  return normalized;
}

function validatePincode(pincode: string): string {
  const normalized = pincode.trim();

  if (!/^\d{6}$/.test(normalized)) {
    throw new AppError(400, "pincode must be a valid 6-digit number");
  }

  return normalized;
}

function validateAddressInput(input: AddressInput) {
  const fullName = input.fullName.trim();
  const address = input.address.trim();
  const city = input.city.trim();

  if (!fullName) {
    throw new AppError(400, "fullName is required");
  }

  if (!address) {
    throw new AppError(400, "address is required");
  }

  if (!city) {
    throw new AppError(400, "city is required");
  }

  const phone = validatePhone(input.phone);
  const pincode = validatePincode(input.pincode);
  const alternativePh = input.alternativePh?.trim()
    ? validatePhone(input.alternativePh, "alternativePh")
    : null;
  const notes = input.notes?.trim() || null;

  return {
    fullName,
    phone,
    address,
    city,
    pincode,
    alternativePh,
    notes,
  };
}

export function formatAddress(address: {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  alternativePh: string | null;
  notes: string | null;
  createdAt: Date;
}) {
  return {
    id: address.id,
    fullName: address.fullName,
    phone: address.phone,
    address: address.address,
    city: address.city,
    pincode: address.pincode,
    alternativePh: address.alternativePh,
    notes: address.notes,
    createdAt: address.createdAt.toISOString(),
  };
}

async function getOwnedAddress(customerId: string, addressId: string) {
  const address = await prisma.customerAddress.findFirst({
    where: {
      id: addressId,
      customerId,
    },
  });

  if (!address) {
    throw new AppError(404, "Address not found");
  }

  return address;
}

export async function createCustomerAddress(
  customerId: string,
  input: AddressInput,
) {
  const data = validateAddressInput(input);

  const address = await prisma.customerAddress.create({
    data: {
      customerId,
      ...data,
    },
  });

  return formatAddress(address);
}

export async function updateCustomerAddress(
  customerId: string,
  addressId: string,
  input: AddressUpdateInput,
) {
  const existing = await getOwnedAddress(customerId, addressId);

  const data: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    pincode?: string;
    alternativePh?: string | null;
    notes?: string | null;
  } = {};

  if (input.fullName !== undefined) {
    const fullName = input.fullName.trim();
    if (!fullName) {
      throw new AppError(400, "fullName cannot be empty");
    }
    data.fullName = fullName;
  }

  if (input.phone !== undefined) {
    data.phone = validatePhone(input.phone);
  }

  if (input.address !== undefined) {
    const address = input.address.trim();
    if (!address) {
      throw new AppError(400, "address cannot be empty");
    }
    data.address = address;
  }

  if (input.city !== undefined) {
    const city = input.city.trim();
    if (!city) {
      throw new AppError(400, "city cannot be empty");
    }
    data.city = city;
  }

  if (input.pincode !== undefined) {
    data.pincode = validatePincode(input.pincode);
  }

  if (input.alternativePh !== undefined) {
    data.alternativePh = input.alternativePh?.trim()
      ? validatePhone(input.alternativePh, "alternativePh")
      : null;
  }

  if (input.notes !== undefined) {
    data.notes = input.notes?.trim() || null;
  }

  if (!Object.keys(data).length) {
    return formatAddress(existing);
  }

  const address = await prisma.customerAddress.update({
    where: { id: existing.id },
    data,
  });

  return formatAddress(address);
}

export async function deleteCustomerAddress(
  customerId: string,
  addressId: string,
) {
  await getOwnedAddress(customerId, addressId);

  await prisma.customerAddress.delete({
    where: { id: addressId },
  });
}
