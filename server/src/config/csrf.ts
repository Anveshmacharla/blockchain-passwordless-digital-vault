import type { Request } from "express";
import { doubleCsrf } from "csrf-csrf";

const csrfSecret = process.env.CSRF_SECRET;

if (!csrfSecret) {
  throw new Error("CSRF_SECRET is not defined");
}

export const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => csrfSecret,

  getSessionIdentifier: (req: Request) => {
    const accessToken = req.cookies?.access_token;

    if (!accessToken) {
      throw new Error("Authentication cookie is missing");
    }

    return accessToken;
  },

  cookieName: "__Host-csrf-token",

  cookieOptions: {
    httpOnly: false,
    secure: true,
    sameSite: "strict",
    path: "/",
  },

  getCsrfTokenFromRequest: (req: Request) => {
    return req.headers["x-csrf-token"];
  },
});