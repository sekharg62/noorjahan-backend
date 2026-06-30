import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: string;
  type?: "admin";
}

export interface CustomerJwtPayload {
  sub: string;
  phone: string;
  type: "customer";
}

export function signAdminToken(payload: AdminJwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign({ ...payload, type: "admin" }, env.jwt.secret, options);
}

export function signCustomerToken(payload: Omit<CustomerJwtPayload, "type">): string {
  const options: SignOptions = {
    expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign({ ...payload, type: "customer" }, env.jwt.secret, options);
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  const payload = jwt.verify(token, env.jwt.secret) as AdminJwtPayload;

  if (payload.type && payload.type !== "admin") {
    throw new jwt.JsonWebTokenError("Invalid admin token");
  }

  return payload;
}

export function verifyCustomerToken(token: string): CustomerJwtPayload {
  const payload = jwt.verify(token, env.jwt.secret) as CustomerJwtPayload;

  if (payload.type !== "customer") {
    throw new jwt.JsonWebTokenError("Invalid customer token");
  }

  return payload;
}
