import NextAuth from "next-auth";
import { kasirAuthOptions } from "@/lib/auth";

const handler = NextAuth(kasirAuthOptions);

export { handler as GET, handler as POST };

