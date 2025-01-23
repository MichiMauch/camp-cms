import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

// Hilfsfunktion zur Datumsformatierung
function formatDateForDB(dateStr: string) {
  const [day, month, year] = dateStr.split(".");
  if (!day || !month || !year) throw new Error("Ungültiges Datumsformat");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
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
      args: []
    });

    const visits = result.rows.map((row) => ({
      id: row.id,
      dateFrom: row.dateFrom,
      dateTo: row.dateTo,
      campsiteName: row.campsiteName,
      teaserImage: row.teaserImage,
    }));

    return NextResponse.json(visits);
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Besuche" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { exifData, endDate, fileName } = data;

    if (!exifData || !exifData.address) {
      return NextResponse.json(
        { error: "EXIF-Daten sind unvollständig." },
        { status: 400 }
      );
    }

    // Formatiere die Daten
    const formattedStartDate = formatDateForDB(exifData.modifyDate);
    const formattedEndDate = formatDateForDB(endDate);

    // Überprüfe, ob der Platz bereits existiert
    const existingCampsite = await db.execute({
      sql: "SELECT * FROM campsites WHERE name = ?",
      args: [exifData.address.tourism]
    });

    let campsiteId;
    if (existingCampsite.rows.length > 0) {
      campsiteId = existingCampsite.rows[0].id;
    } else {
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
            altitude, 
            iso_alpha3
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          exifData.address.iso_alpha3
        ]
      });
      campsiteId = newCampsite.rows[0].id;
    }

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
      args: [campsiteId, formattedStartDate, formattedEndDate, fileName]
    });

    return NextResponse.json({ 
      success: true,
      message: "Besuch wurde erfolgreich gespeichert" 
    });
  } catch (error) {
    console.error("Error saving visit:", error);
    return NextResponse.json(
      { error: "Fehler beim Speichern des Besuchs" },
      { status: 500 }
    );
  }
}

// Optional: DELETE Handler für das Löschen von Besuchen
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Keine Besuchs-ID angegeben" },
        { status: 400 }
      );
    }

    await db.execute({
      sql: "DELETE FROM visits WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({ 
      success: true,
      message: "Besuch wurde erfolgreich gelöscht" 
    });
  } catch (error) {
    console.error("Error deleting visit:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Besuchs" },
      { status: 500 }
    );
  }
}

