import { createClient } from "@libsql/client"
import bcrypt from "bcrypt"

const db = createClient({
  url: "libsql://camp-cms-netnode-ag.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MzU2NDMwNjMsImlkIjoiMjJjZTM3M2MtZmM3OC00MTY3LTg3YjEtNmMyN2QyYmYzZTdiIn0.nGIP_mx_7lf9iU2_03uOBAelg1NJrB2ONLQK3BRudJJuOSIG831Y1iOVmosQghKQCkGjSUGYAzx-U_YFgVOfAg",
})

async function resetPassword() {
  try {
    const newPassword = "Star-1974-2005"
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const users = await db.execute("SELECT * FROM users")
    console.log("Gefundene Benutzer:", users.rows)

    if (users.rows.length > 0) {
      const user = users.rows[0]
      const result = await db.execute({
        sql: "UPDATE users SET password = ? WHERE email = ?",
        args: [hashedPassword, user.email],
      })

      console.log(`Passwort für ${user.email} wurde erfolgreich zurückgesetzt`)
      console.log("Update-Ergebnis:", result)
    } else {
      console.log("Keine Benutzer in der Datenbank gefunden")
    }

    process.exit(0)
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error)
    process.exit(1)
  }
}

resetPassword()