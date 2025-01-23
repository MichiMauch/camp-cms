import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');

  console.log('Received coordinates:', { latitude, longitude });

  if (!latitude || !longitude) {
    return NextResponse.json({ error: 'Latitude und Longitude sind erforderlich.' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=de`
    );

    if (!response.ok) {
      throw new Error('Fehler bei der Nominatim-API-Anfrage.');
    }

    const data = await response.json();
    console.log('Nominatim API response:', data);
    const { address } = data;
    const result = {
      ...data,
      state: address.state || address.county || ''
    };
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Fehler bei der Nominatim-API-Anfrage.' }, { status: 500 });
  }
}
