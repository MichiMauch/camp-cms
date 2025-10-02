import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/turso';
import { requireAuth } from '@/lib/middleware/auth';
import { handleCors, addCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

// GET - Mobile optimized visits list
async function getVisits(request: NextRequest, user: any) {
  try {
    const result = await db.execute({
      sql: `
        SELECT
          v.id AS id,
          v.campsite_id AS campsiteId,
          strftime('%Y-%m-%d', date(v.date_from)) AS date_from,
          strftime('%Y-%m-%d', date(v.date_to)) AS date_to,
          v.visit_image AS visit_image,
          v.notes AS notes,
          c.name AS campsiteName,
          c.location AS campsiteLocation
        FROM visits v
        JOIN campsites c ON v.campsite_id = c.id
        ORDER BY DATE(v.date_from) DESC
        LIMIT 100
      `,
      args: [],
    });

    const visits = result.rows.map((row) => ({
      id: row.id?.toString(),
      campsite_id: row.campsiteId?.toString(),
      date_from: row.date_from?.toString(),
      date_to: row.date_to?.toString(),
      visit_image: row.visit_image?.toString(),
      notes: row.notes?.toString(),
      campsiteName: row.campsiteName?.toString(),
      campsiteLocation: row.campsiteLocation?.toString(),
    }));

    const response = NextResponse.json(visits);
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Error fetching mobile visits:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch visits' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}

// POST - Create new visit from mobile app
async function createVisit(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Mobile app FormData mit EXIF-Daten-Struktur
    const exifDataString = formData.get('exifData') as string;
    const endDate = formData.get('endDate') as string;
    const fileName = formData.get('fileName') as string;
    const placeType = formData.get('placeType') as string;
    const campsiteId = formData.get('campsiteId') as string;
    const image = formData.get('image') as File;

    // EXIF-Daten parsen
    let exifData;
    try {
      exifData = JSON.parse(exifDataString);
    } catch (error) {
      return NextResponse.json({ error: "Ungültige EXIF-Daten" }, { status: 400 });
    }

    console.log("Mobile visit data with EXIF:", {
      exifData, endDate, fileName, placeType, campsiteId
    });

    // Datumsvalidierung
    const startDate = exifData.modifyDate;
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Datum Von und Bis sind erforderlich" }, { status: 400 });
    }

    // Format dates for database
    const formatDateForDB = (dateStr: string) => {
      if (dateStr.includes('-') && dateStr.length === 10) {
        return dateStr;
      }
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    };

    const formattedStartDate = formatDateForDB(startDate);
    const formattedEndDate = formatDateForDB(endDate);

    let finalCampsiteId: string;

    if (placeType === 'new') {
      // Neue Campsite aus EXIF-Daten erstellen
      const placeName = exifData.address.tourism;
      const placeLocation = exifData.address.village;

      if (!placeName || !placeLocation) {
        return NextResponse.json({ error: "Name und Ort für neuen Platz sind erforderlich" }, { status: 400 });
      }

      // Check if campsite already exists
      const existingCampsite = await db.execute({
        sql: "SELECT id FROM campsites WHERE name = ? AND location = ?",
        args: [placeName, placeLocation],
      });

      if (existingCampsite.rows.length > 0) {
        finalCampsiteId = existingCampsite.rows[0].id as string;
      } else {
        // Create new campsite mit EXIF-Daten
        const newCampsite = await db.execute({
          sql: `
            INSERT INTO campsites (
              name,
              location,
              teaser_image,
              latitude,
              longitude,
              country,
              country_code,
              state,
              altitude
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
          `,
          args: [
            placeName,
            placeLocation,
            fileName,
            exifData.latitude || null,
            exifData.longitude || null,
            exifData.address.country,
            exifData.address.country_code,
            exifData.address.state,
            exifData.gpsAltitude || 0,
          ],
        });

        finalCampsiteId = newCampsite.rows[0].id as string;
      }
    } else {
      if (!campsiteId) {
        return NextResponse.json({ error: "Campingplatz-ID ist erforderlich" }, { status: 400 });
      }
      finalCampsiteId = campsiteId;
    }

    // Create visit record mit eigenem fileName
    const visitResult = await db.execute({
      sql: `
        INSERT INTO visits (
          campsite_id,
          date_from,
          date_to,
          visit_image,
          notes
        )
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
      `,
      args: [
        finalCampsiteId,
        formattedStartDate,
        formattedEndDate,
        fileName,
        null, // Notes werden aus der Mobile App entfernt
      ],
    });

    const visitId = visitResult.rows[0].id;

    // TODO: Handle image upload to Cloudflare R2
    // For now, we just return the visit data

    const response = NextResponse.json({
      success: true,
      message: "Besuch wurde erfolgreich gespeichert",
      id: visitId?.toString(),
      campsite_id: finalCampsiteId,
    });

    return addCorsHeaders(response);

  } catch (error) {
    console.error('Error creating mobile visit:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to create visit' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}

// Remove auth for mobile app
export const GET = getVisits;
export const POST = createVisit;