// Place Discovery Service using OpenAI API

import type { DiscoveredPlace, PlaceDiscoveryRequest, PlaceDiscoveryResponse, Coordinates } from '@/types/places'

export class PlaceDiscoveryService {
  private openaiApiKey: string | undefined

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY
  }

  async discoverPlaces(request: PlaceDiscoveryRequest): Promise<PlaceDiscoveryResponse> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const prompt = request.searchType === 'region'
        ? this.buildRegionDiscoveryPrompt(request.region!)
        : this.buildCoordinateDiscoveryPrompt(request.center!, request.radius!)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a travel expert who provides detailed, inspiring information about interesting places to visit. Always respond with valid JSON only, no additional text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json() as { choices?: { message?: { content?: string } }[] }
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No content received from OpenAI')
      }

      // Parse the JSON response
      const parsedPlaces = JSON.parse(content)

      // Validate and transform the response
      const places: DiscoveredPlace[] = parsedPlaces.places.map((place: any) => ({
        name: place.name,
        description: place.description,
        why_interesting: place.why_interesting,
        category: place.category,
        location: place.location,
        estimated_visit_duration: place.estimated_visit_duration,
        best_time_to_visit: place.best_time_to_visit,
        practical_tips: place.practical_tips,
        latitude: this.validateLatitude(place.latitude),
        longitude: this.validateLongitude(place.longitude)
      }))

      const regionName = request.searchType === 'region'
        ? request.region!
        : `Bereich um ${request.center!.lat.toFixed(4)}, ${request.center!.lng.toFixed(4)} (${request.radius}km)`

      return {
        region: regionName,
        places,
        generated_at: new Date().toISOString()
      }

    } catch (error) {
      console.error('Place discovery error:', error)
      throw error
    }
  }

  private buildRegionDiscoveryPrompt(region: string): string {
    return `
Bitte gib mir 8-12 der interessantesten und einzigartigsten Orte an, die man in ${region} besuchen kann.
Konzentriere dich auf Orte, die:
- Wirklich faszinierend und einen Besuch wert sind
- Eine Mischung aus berühmten Attraktionen und versteckten Perlen
- Verschiedene Kategorien (Natur, Kultur, Geschichte, Architektur, etc.)
- Für Reisende geeignet sind, die unvergessliche Erfahrungen suchen

Für jeden Ort, gib folgende Informationen auf Deutsch:
- name: Der genaue Name des Ortes
- description: Eine überzeugende 2-3 Sätze umfassende Beschreibung
- why_interesting: Was diesen Ort besonders oder einzigartig macht
- category: Eine von: "Natur", "Kultur", "Geschichte", "Architektur", "Abenteuer", "Essen", "Kunst", "Spirituell", "Wissenschaft", "Unterhaltung"
- location: Stadt/Gebiet innerhalb der Region
- estimated_visit_duration: Wie lange man dort verbringen sollte (z.B., "2-3 Stunden", "Halber Tag", "Ganzer Tag")
- best_time_to_visit: Beste Jahreszeit oder Zeit (optional)
- practical_tips: Ein nützlicher Tipp für Besucher (optional)
- latitude: Breitengrad als Dezimalzahl (z.B., 47.3769)
- longitude: Längengrad als Dezimalzahl (z.B., 8.5417)

Antworte NUR mit dieser JSON-Struktur (alle Texte auf Deutsch):
{
  "places": [
    {
      "name": "Ortsname",
      "description": "Beschreibung hier",
      "why_interesting": "Was es besonders macht",
      "category": "Kategorie",
      "location": "Stadt/Gebiet",
      "estimated_visit_duration": "Dauer",
      "best_time_to_visit": "Beste Zeit",
      "practical_tips": "Nützlicher Tipp",
      "latitude": 47.3769,
      "longitude": 8.5417
    }
  ]
}
    `.trim()
  }

  private buildCoordinateDiscoveryPrompt(center: Coordinates, radius: number): string {
    return `
Bitte gib mir 8-12 der interessantesten und einzigartigsten Orte an, die man im Umkreis von ${radius} Kilometern um die Koordinaten ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)} besuchen kann.

Konzentriere dich auf Orte, die:
- Wirklich faszinierend und einen Besuch wert sind
- Innerhalb des angegebenen Radius liegen
- Besonders sehenswert oder historisch bedeutsam sind
- Nicht nur bekannte touristische Hotspots, sondern auch versteckte Perlen
- Verschiedene Kategorien abdecken (Natur, Kultur, Geschichte, Architektur, etc.)

Gib für jeden Ort folgende Informationen an:
- Name des Ortes
- Detailierte Beschreibung (2-3 Sätze)
- Warum er besonders interessant ist
- Kategorie (Natur, Kultur, Geschichte, Architektur, Abenteuer, Essen, Kunst, Spirituell, Wissenschaft, Unterhaltung)
- Ort/Stadt in der Nähe
- Geschätzte Besuchsdauer
- Beste Zeit für einen Besuch
- Ein praktischer Tipp für Besucher
- Genaue Latitude und Longitude Koordinaten

Antworte NUR mit dieser JSON-Struktur (alle Texte auf Deutsch):
{
  "places": [
    {
      "name": "Ortsname",
      "description": "Beschreibung hier",
      "why_interesting": "Was es besonders macht",
      "category": "Kategorie",
      "location": "Stadt/Gebiet",
      "estimated_visit_duration": "Dauer",
      "best_time_to_visit": "Beste Zeit",
      "practical_tips": "Nützlicher Tipp",
      "latitude": 47.3769,
      "longitude": 8.5417
    }
  ]
}
    `.trim()
  }

  private validateLatitude(lat: any): number | undefined {
    if (typeof lat !== 'number') return undefined
    if (lat < -90 || lat > 90) return undefined
    return lat
  }

  private validateLongitude(lon: any): number | undefined {
    if (typeof lon !== 'number') return undefined
    if (lon < -180 || lon > 180) return undefined
    return lon
  }
}