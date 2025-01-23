import { createClient } from "@libsql/client"; // Richtiges Package

console.log("TURSO_DATABASE_URL:", process.env.TURSO_DATABASE_URL);
console.log("TURSO_DATABASE_AUTH_TOKEN:", process.env.TURSO_DATABASE_AUTH_TOKEN);

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_DATABASE_AUTH_TOKEN) {
  throw new Error(
    "Umgebungsvariablen TURSO_DATABASE_URL und TURSO_DATABASE_AUTH_TOKEN sind erforderlich."
  );
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_DATABASE_AUTH_TOKEN;

export const db = createClient({ url, authToken });
