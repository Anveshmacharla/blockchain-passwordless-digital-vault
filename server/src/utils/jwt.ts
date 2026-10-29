import jwt, { JwtPayload } from "jsonwebtoken";
import { jwtConfig } from "../config/jwt";

export interface AuthTokenPayload extends JwtPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (
  userId: string,
  role: string
): string => {
  return jwt.sign(
    {
      userId,
      role,
    },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
    }
  );
};

export const verifyAccessToken = (
  token: string
): AuthTokenPayload => {
  const payload = jwt.verify(
    token,
    jwtConfig.secret
  );

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.userId !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid access token payload");
  }

  return payload as AuthTokenPayload;
};