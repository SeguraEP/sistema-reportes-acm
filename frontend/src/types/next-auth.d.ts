//frontend/src/types/next-auth.d.ts

import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    rol: string;
    cedula: string;
    accessToken: string;
    refreshToken: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
      rol: string;
      cedula: string;
      accessToken: string;
      refreshToken: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    rol: string;
    cedula: string;
    accessToken: string;
    refreshToken: string;
  }
}
