import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/turso"; // Turso-Datenbankverbindung importieren
import bcrypt from "bcrypt"; // bcrypt für Passwortvergleich importieren

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Authorize called with:", credentials); // Debugging

        if (!credentials) {
          console.log("No credentials provided");
          return null;
        }

        try {
          // Datenbankabfrage, um Benutzer mit der angegebenen E-Mail zu finden
          const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
            args: [credentials.email],
          });

          const user = result.rows[0];

          if (!user) {
            console.log("User not found");
            return null;
          }

          // Passwortüberprüfung mit bcrypt
          if (!user.password) {
            console.log("User password is null");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password.toString()
          );

          if (!isPasswordValid) {
            console.log("Invalid password");
            return null;
          }

          console.log("User authenticated:", user);
          return {
            id: user.id ? user.id.toString() : "",
            name: user.name ? user.name.toString() : "",
            email: user.email ? user.email.toString() : "",
          }; // Rückgabe des Benutzers bei erfolgreicher Authentifizierung
        } catch (error) {
          console.error("Database error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login", // Redirect to login page on auth errors
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debugging
};

// Wichtig: Exportiere GET und POST
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
