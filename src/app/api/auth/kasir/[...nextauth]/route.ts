import NextAuth from "next-auth";
import { kasirAuthOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const nextAuthHandler = NextAuth(kasirAuthOptions);

const handler = async (req: NextRequest, ctx: any) => {
  return nextAuthHandler(req, ctx);
};

export { handler as GET, handler as POST };
