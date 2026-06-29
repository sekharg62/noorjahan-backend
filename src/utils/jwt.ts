import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: string;
}

export function signAdminToken(payload: AdminJwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.jwt.secret, options);
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  return jwt.verify(token, env.jwt.secret) as AdminJwtPayload;
}
