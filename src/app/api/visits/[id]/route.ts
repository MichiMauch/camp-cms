import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.execute({
      sql: `
        SELECT 
          v.id AS id,
          strftime('%Y-%m-%d', v.date_from) AS dateFrom,
          strftime('%Y-%m-%d', v.date_to) AS dateTo,
          v.visit_image AS visitImage,
          c.id AS campsiteId,
          c.name AS campsiteName,
          c.location AS campsiteLocation,
          c.latitude AS latitude,
          c.longitude AS longitude
        FROM visits v
        JOIN campsites c ON v.campsite_id = c.id
        WHERE v.id = ?
      `,
      args: [params.id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    const visit = result.rows[0];

    return NextResponse.json({
      id: visit.id,
      dateFrom: visit.dateFrom,
      dateTo: visit.dateTo,
      visitImage: visit.visitImage,
      campsite: {
        id: visit.campsiteId,
        name: visit.campsiteName,
        location: visit.campsiteLocation,
        latitude: visit.latitude,
        longitude: visit.longitude,
      },
    });
  } catch (error) {
    console.error("Error fetching visit details:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { dateFrom, dateTo, visitImage } = body;

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "Missing required fields: dateFrom or dateTo" },
        { status: 400 }
      );
    }

    // Dates should already be in YYYY-MM-DD format
    await db.execute({
      sql: `
        UPDATE visits
        SET date_from = ?, date_to = ?, visit_image = ?
        WHERE id = ?
      `,
      args: [dateFrom, dateTo, visitImage || null, id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating visit details:", error);
    return NextResponse.json(
      { error: "Failed to update visit details" },
      { status: 500 }
    );
  }
}

