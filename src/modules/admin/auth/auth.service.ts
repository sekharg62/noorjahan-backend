import bcrypt from "bcryptjs";
import { prisma } from "../../../config/database";
import { AppError } from "../../../middleware/errorHandler";
import { signAdminToken } from "../../../utils/jwt";

interface LoginInput {
  email: string;
  password: string;
}

export async function loginAdmin(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin) {
    throw new AppError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    admin.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signAdminToken({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
  });

  return {
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
}
