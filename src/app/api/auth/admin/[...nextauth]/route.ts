import NextAuth from "next-auth";
import { adminAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const nextAuthHandler = NextAuth(adminAuthOptions);

const handler = async (req: NextRequest, ctx: any) => {
  return nextAuthHandler(req, ctx);
};

export { handler as GET, handler as POST };
