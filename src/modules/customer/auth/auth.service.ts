import bcrypt from "bcryptjs";
import { prisma } from "../../../config/database";
import { AppError } from "../../../middleware/errorHandler";
import { signCustomerToken } from "../../../utils/jwt";

const BCRYPT_ROUNDS = 10;

interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits;
}

function formatCustomer(customer: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
  };
}

function buildAuthResult(customer: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}) {
  const token = signCustomerToken({
    sub: customer.id,
    phone: customer.phone,
  });

  return {
    token,
    customer: formatCustomer(customer),
  };
}

interface LoginInput {
  phone: string;
  password: string;
}

export async function registerCustomer(input: RegisterInput) {
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const email = input.email?.trim().toLowerCase() || null;

  if (!name) {
    throw new AppError(400, "name is required");
  }

  if (!/^\d{10}$/.test(phone)) {
    throw new AppError(400, "phone must be a valid 10-digit number");
  }

  if (input.password.length < 6) {
    throw new AppError(400, "password must be at least 6 characters");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(400, "email is invalid");
  }

  const existingByPhone = await prisma.customer.findUnique({
    where: { phone },
  });

  if (existingByPhone) {
    throw new AppError(409, "Phone number is already registered");
  }

  if (email) {
    const existingByEmail = await prisma.customer.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      throw new AppError(409, "Email is already registered");
    }
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const customer = await prisma.customer.create({
    data: {
      name,
      phone,
      email,
      passwordHash,
    },
  });

  return buildAuthResult(customer);
}

export async function loginCustomer(input: LoginInput) {
  const phone = normalizePhone(input.phone);

  if (!/^\d{10}$/.test(phone)) {
    throw new AppError(400, "phone must be a valid 10-digit number");
  }

  const customer = await prisma.customer.findUnique({
    where: { phone },
  });

  if (!customer?.passwordHash) {
    throw new AppError(401, "Invalid phone or password");
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    customer.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid phone or password");
  }

  return buildAuthResult(customer);
}
