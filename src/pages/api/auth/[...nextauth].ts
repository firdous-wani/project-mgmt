import NextAuth from "next-auth";
import { authConfig } from "@/server/auth/config";

const handler = NextAuth(authConfig);
export default handler; 