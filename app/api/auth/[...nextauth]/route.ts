import { loginService } from "@/services/auth.service";
import type { LoginRequest, LoginResponse } from "@/types/auth.types";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { decodeJwt } from "jose";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "test@gmail.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        const request: LoginRequest = {
          emailOrPhonenumber: credentials.email,
          password: credentials.password
        }
        const res = await loginService(request);
        
        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || "Invalid email or password")
          } catch {
            throw new Error("Invalid email or password")
          }
        }

        const data: LoginResponse = await res.json()
        
        // data.data contains the JWT token string from backend
        if (!data.data || typeof data.data !== 'string') {
          throw new Error("Invalid response from server")
        }

        const token = data.data as string;
        
        // Decode JWT to extract user info (without verification)
        try {
          const decoded = decodeJwt(token);
          
          // Extract user info from JWT payload
          const userId = decoded.userId as string;
          const email = decoded.sub as string;
          const role = decoded.role as string;
          const name = email.split('@')[0]; // Extract name from email if not provided
          
          return {
            id: userId,
            email: email,
            name: name,
            role: role,
            backendToken: token, 
          }
        } catch {
          throw new Error("Failed to decode authentication token")
        }
      }
    })
  ],

  session: {
    strategy: "jwt"
  },

  pages: {
    signIn: "/login"
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.backendToken = (user as any).backendToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      (session as any).backendToken = token.backendToken
      return session
    }
  },

  secret: process.env.NEXTAUTH_SECRET
  
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }
