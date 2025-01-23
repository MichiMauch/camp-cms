import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/turso"
import bcrypt from "bcrypt"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        try {
          const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
            args: [credentials.email],
          })

          const user = result.rows[0]

          if (!user) {
            console.log("User not found")
            return null
          }

          if (!user.password) {
            console.log("User password is null")
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password.toString())

          if (!isPasswordValid) {
            console.log("Invalid password")
            return null
          }

          return {
            id: user.id?.toString() ?? "",
            name: user.name?.toString() ?? "",
            email: user.email?.toString() ?? "",
          }
        } catch (error) {
          console.error("Database error:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

