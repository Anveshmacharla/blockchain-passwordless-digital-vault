import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not defined");
}

export const jwtConfig: {
  secret: string;
  expiresIn: SignOptions["expiresIn"];
} = {
  secret: jwtSecret,
  expiresIn: "30m",
};