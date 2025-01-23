import { NextApiRequest, NextApiResponse } from 'next';

export const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("Request query:", req.query);
  const { latitude, longitude, radius = 3000 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude und Longitude sind erforderlich.' });
  }

  const lat = Array.isArray(latitude) ? latitude[0] : latitude;
  const lon = Array.isArray(longitude) ? longitude[0] : longitude;

  console.log("Latitude:", lat, "Longitude:", lon);

  const overpassQuery = `
    [out:json];
    (
      node["tourism"="attraction"](around:${radius},${lat},${lon});
      way["tourism"="attraction"](around:${radius},${lat},${lon});
      relation["tourism"="attraction"](around:${radius},${lat},${lon});
    );
    out center;`;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    console.log("Overpass API URL:", url);
    const response = await fetch(url);
    console.log("Overpass API Response Status:", response.status);
    if (!response.ok) {
      throw new Error('Fehler bei der Overpass-API-Anfrage.');
    }
    const data = await response.json();
    console.log("Fetched data from Overpass API:", data);
    res.status(200).json(data);
  } catch (error: unknown) {
    console.error("Error fetching data from Overpass API:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};
