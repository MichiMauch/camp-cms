import { NextResponse } from "next/server"
import { db } from "@/lib/turso"

// Hilfsfunktion zur Datumsformatierung
function formatDateForDB(dateStr: string) {
  try {
    const [day, month, year] = dateStr.split(".")
    if (!day || !month || !year) throw new Error("Ungültiges Datumsformat")
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  } catch (error) {
    console.error("Date formatting error:", error, "for date:", dateStr)
    throw new Error(`Ungültiges Datumsformat: ${dateStr}`)
  }
}

export async function GET() {
  try {
    const result = await db.execute({
      sql: `
        SELECT 
          v.id AS id,
          strftime('%d.%m.%Y', date(v.date_from)) AS dateFrom,
          strftime('%d.%m.%Y', date(v.date_to)) AS dateTo,
          v.visit_image AS teaserImage,
          c.name AS campsiteName
        FROM visits v
        JOIN campsites c ON v.campsite_id = c.id
        ORDER BY DATE(v.date_from) DESC
      `,
      args: [],
    })

    const visits = result.rows.map((row) => ({
      id: row.id,
      dateFrom: row.dateFrom,
      dateTo: row.dateTo,
      campsiteName: row.campsiteName,
      teaserImage: row.teaserImage,
    }))

    return NextResponse.json(visits)
  } catch (error) {
    console.error("Error fetching visits:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Besuche" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("Received data:", JSON.stringify(data, null, 2))

    const { exifData, endDate, fileName, placeType, campsiteId } = data

    if (!exifData || !exifData.address) {
      console.error("Missing exifData or address")
      return NextResponse.json({ error: "EXIF-Daten sind unvollständig." }, { status: 400 })
    }

    console.log("Processing dates:", {
      modifyDate: exifData.modifyDate,
      endDate: endDate,
    })

    // Formatiere die Daten
    const formattedStartDate = formatDateForDB(exifData.modifyDate)
    const formattedEndDate = formatDateForDB(endDate)

    console.log("Formatted dates:", {
      formattedStartDate,
      formattedEndDate,
    })

    let finalCampsiteId: string

    if (placeType === "existing") {
      if (!campsiteId) {
        console.error("No campsiteId provided for existing place")
        return NextResponse.json({ error: "Keine Campingplatz-ID für bestehenden Platz" }, { status: 400 })
      }
      finalCampsiteId = campsiteId
      console.log("Using existing campsite:", finalCampsiteId)
    } else {
      console.log("Checking for existing campsite:", {
        name: exifData.address.tourism,
        location: exifData.address.village,
      })

      // Überprüfe, ob der Platz bereits existiert
      const existingCampsite = await db.execute({
        sql: "SELECT id FROM campsites WHERE name = ? AND location = ?",
        args: [exifData.address.tourism, exifData.address.village],
      })

      if (existingCampsite.rows.length > 0) {
        finalCampsiteId = existingCampsite.rows[0].id as string
        console.log("Found existing campsite:", finalCampsiteId)
      } else {
        console.log("Creating new campsite with data:", {
          name: exifData.address.tourism,
          location: exifData.address.village,
          // ... other fields
        })

        // Füge einen neuen Eintrag in die Tabelle `campsites` ein
        const newCampsite = await db.execute({
          sql: `
            INSERT INTO campsites (
              name, 
              location, 
              teaser_image, 
              latitude, 
              longitude, 
              country, 
              state, 
              country_code, 
              altitude
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
          `,
          args: [
            exifData.address.tourism,
            exifData.address.village,
            fileName,
            exifData.latitude,
            exifData.longitude,
            exifData.address.country,
            exifData.address.state,
            exifData.address.country_code,
            exifData.gpsAltitude,
          ],
        })
        finalCampsiteId = newCampsite.rows[0].id as string
        console.log("Created new campsite:", finalCampsiteId)
      }
    }

    console.log("Inserting visit with data:", {
      campsiteId: finalCampsiteId,
      dateFrom: formattedStartDate,
      dateTo: formattedEndDate,
      fileName,
    })

    // Füge einen neuen Eintrag in die Tabelle `visits` ein
    await db.execute({
      sql: `
        INSERT INTO visits (
          campsite_id, 
          date_from, 
          date_to, 
          visit_image
        )
        VALUES (?, ?, ?, ?)
      `,
      args: [finalCampsiteId, formattedStartDate, formattedEndDate, fileName],
    })

    return NextResponse.json({
      success: true,
      message: "Besuch wurde erfolgreich gespeichert",
    })
  } catch (error) {
    console.error("Detailed error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Fehler beim Speichern des Besuchs",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Keine Besuchs-ID angegeben" }, { status: 400 })
    }

    await db.execute({
      sql: "DELETE FROM visits WHERE id = ?",
      args: [id],
    })

    return NextResponse.json({
      success: true,
      message: "Besuch wurde erfolgreich gelöscht",
    })
  } catch (error) {
    console.error("Error deleting visit:", error)
    return NextResponse.json({ error: "Fehler beim Löschen des Besuchs" }, { status: 500 })
  }
}

