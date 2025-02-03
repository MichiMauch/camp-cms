// Lade Umgebungsvariablen mit explizitem Pfad
const path = require('path')
const dotenv = require('dotenv')

// Debug: Zeige den aktuellen Arbeitsverzeichnis-Pfad
console.log('Current working directory:', process.cwd())

// Versuche die .env Datei explizit zu laden
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (result.error) {
  console.error('Error loading .env file:', result.error)
  process.exit(1)
}

// Debug: Zeige alle geladenen Umgebungsvariablen (ohne sensitive Daten)
console.log('Loaded environment variables:')
Object.keys(process.env).forEach(key => {
  if (key.startsWith('TURSO_') || key.startsWith('OPENROUTE_')) {
    console.log(`${key}: ${key.includes('TOKEN') || key.includes('KEY') ? '[HIDDEN]' : process.env[key]}`)
  }
})

// Überprüfe Umgebungsvariablen
const requiredEnvVars = [
  'TURSO_DATABASE_URL',
  'TURSO_DATABASE_AUTH_TOKEN',
  'OPENROUTE_API_KEY'
]

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingEnvVars.length > 0) {
  console.error('\nFehlende Umgebungsvariablen:', missingEnvVars.join(', '))
  console.error('Inhalt der .env Datei sollte sein:')
  console.error(`
TURSO_DATABASE_URL=libsql://camp-cms-netnode-ag.turso.io
TURSO_DATABASE_AUTH_TOKEN=your_auth_token
OPENROUTE_API_KEY=your_api_key
  `)
  process.exit(1)
}

const { createClient } = require('@libsql/client')

// Debug-Ausgabe der Konfiguration (ohne sensitive Daten)
console.log('Database Configuration:')
console.log('Database URL:', process.env.TURSO_DATABASE_URL)
console.log('Auth Token exists:', !!process.env.TURSO_DATABASE_AUTH_TOKEN)
console.log('OpenRoute API Key exists:', !!process.env.OPENROUTE_API_KEY)

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_DATABASE_AUTH_TOKEN
})

const HOME_COORDINATES = [8.05558, 47.33243] // [longitude, latitude]

// Rate Limiting Queue
class RequestQueue {
  constructor(requestsPerMinute = 35) { // Using 35 to stay safely under the 40 limit
    this.queue = []
    this.processing = false
    this.requestsPerMinute = requestsPerMinute
    this.requestTimes = []
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      this.process()
    })
  }

  async process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      // Check rate limit
      const now = Date.now()
      this.requestTimes = this.requestTimes.filter(time => time > now - 60000)
      
      if (this.requestTimes.length >= this.requestsPerMinute) {
        const oldestRequest = this.requestTimes[0]
        const waitTime = 60000 - (now - oldestRequest)
        console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime/1000)} seconds...`)
        await wait(waitTime)
        continue
      }

      const { fn, resolve, reject } = this.queue.shift()
      try {
        this.requestTimes.push(Date.now())
        const result = await fn()
        resolve(result)
      } catch (error) {
        reject(error)
      }

      // Small delay between requests
      await wait(100)
    }

    this.processing = false
  }
}

const requestQueue = new RequestQueue()

async function calculateRoute(coordinates) {
  return requestQueue.add(async () => {
    console.log("\n=== Route Calculation ===")
    console.log("Input coordinates:", coordinates.map(coord => 
      `[${coord[0]}, ${coord[1]}]`
    ).join(" -> "))

    const body = {
      coordinates,
      profile: "driving-car",
      format: "json",
    }

    try {
      const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
        method: "POST",
        headers: {
          "Authorization": process.env.OPENROUTE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("OpenRouteService API error response:", errorText)
        throw new Error(`OpenRouteService API error: ${response.statusText}. Details: ${errorText}`)
      }

      const data = await response.json()
      const distance = data.routes[0].summary.distance / 1000 // Konvertiere zu Kilometern
      console.log("Route distance:", Math.round(distance), "km")
      console.log("=== End Route Calculation ===\n")
      return distance
    } catch (error) {
      console.error("Error in calculateRoute:", error)
      throw error
    }
  })
}

async function calculateTripDistance(visits) {
  if (!visits || visits.length === 0) {
    return 0
  }

  let totalDistance = 0

  try {
    // Calculate route: Home -> First Campsite
    let tripCoordinates = [
      HOME_COORDINATES,
      [visits[0].longitude, visits[0].latitude]
    ]
    let distance = await calculateRoute(tripCoordinates)
    totalDistance += distance || 0 // Füge 0 hinzu wenn distance NaN ist

    // Calculate routes between consecutive campsites
    for (let i = 0; i < visits.length - 1; i++) {
      const currentVisit = visits[i]
      const nextVisit = visits[i + 1]

      // Überspringe Berechnung wenn Koordinaten identisch sind
      if (currentVisit.longitude === nextVisit.longitude && 
          currentVisit.latitude === nextVisit.latitude) {
        console.log("Skipping identical coordinates")
        continue
      }

      tripCoordinates = [
        [currentVisit.longitude, currentVisit.latitude],
        [nextVisit.longitude, nextVisit.latitude]
      ]
      
      distance = await calculateRoute(tripCoordinates)
      totalDistance += distance || 0 // Füge 0 hinzu wenn distance NaN ist
    }

    // Calculate route: Last Campsite -> Home
    tripCoordinates = [
      [visits[visits.length - 1].longitude, visits[visits.length - 1].latitude],
      HOME_COORDINATES
    ]
    distance = await calculateRoute(tripCoordinates)
    totalDistance += distance || 0 // Füge 0 hinzu wenn distance NaN ist

    // Stelle sicher, dass wir eine gültige Zahl zurückgeben
    return Math.round(totalDistance) || 0
  } catch (error) {
    console.error("Error calculating trip distance:", error)
    throw error
  }
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function createTripsTable() {
  console.log("Creating trips table...")

  // Erstelle trips Tabelle
  await db.execute(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_distance INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Prüfe, ob trip_id Spalte bereits existiert
  const tableInfo = await db.execute(`
    PRAGMA table_info(visits)
  `)
  
  const hasTripsColumn = tableInfo.rows.some(row => row.name === 'trip_id')
  
  if (!hasTripsColumn) {
    console.log("Adding trip_id column to visits table...")
    await db.execute(`
      ALTER TABLE visits 
      ADD COLUMN trip_id INTEGER REFERENCES trips(id)
    `)
  } else {
    console.log("trip_id column already exists in visits table")
  }

  console.log("Database schema updated.")
}

async function groupVisitsIntoTrips(visits) {
  const sortedVisits = [...visits].sort((a, b) => 
    new Date(a.date_from).getTime() - new Date(b.date_from).getTime()
  )

  const trips = []
  let currentTrip = null

  for (const visit of sortedVisits) {
    if (!currentTrip) {
      currentTrip = {
        visits: [visit],
        startDate: visit.date_from,
        endDate: visit.date_to,
      }
    } else {
      const lastVisitEndDate = new Date(currentTrip.endDate)
      const visitStartDate = new Date(visit.date_from)
      const daysBetween = (visitStartDate.getTime() - lastVisitEndDate.getTime()) / (1000 * 60 * 60 * 24)

      if (daysBetween === 0) {
        currentTrip.visits.push(visit)
        currentTrip.endDate = visit.date_to
      } else {
        trips.push(currentTrip)
        currentTrip = {
          visits: [visit],
          startDate: visit.date_from,
          endDate: visit.date_to,
        }
      }
    }
  }

  if (currentTrip) {
    trips.push(currentTrip)
  }

  return trips
}

async function migrateTrips() {
  try {
    // Erstelle neue Tabellen
    await createTripsTable()

    // Hole nur Besuche ohne trip_id
    const visitsResult = await db.execute(`
      SELECT 
        v.id,
        v.date_from,
        v.date_to,
        v.campsite_id,
        c.latitude,
        c.longitude
      FROM visits v
      JOIN campsites c ON c.id = v.campsite_id
      WHERE v.trip_id IS NULL
      ORDER BY v.date_from ASC
    `)

    const visits = visitsResult.rows.map(row => ({
      id: row.id,
      date_from: row.date_from,
      date_to: row.date_to,
      campsite_id: row.campsite_id,
      latitude: row.latitude,
      longitude: row.longitude
    }))
    
    if (visits.length === 0) {
      console.log("No new visits to process. All visits are already assigned to trips.")
      return
    }

    console.log(`Found ${visits.length} new visits to process`)

    // Gruppiere Besuche in Trips
    const trips = await groupVisitsIntoTrips(visits)
    console.log(`Grouped into ${trips.length} trips`)

    // Verarbeite jeden Trip
    for (let i = 0; i < trips.length; i++) {
      const trip = trips[i]
      console.log(`\nProcessing trip ${i + 1}/${trips.length}`)
      console.log(`Trip contains ${trip.visits.length} visits`)
      console.log(`From ${trip.startDate} to ${trip.endDate}`)

      try {
        // Berechne die Distanz für den Trip
        const totalDistance = await calculateTripDistance(trip.visits)

        if (isNaN(totalDistance)) {
          console.error(`Invalid distance calculated for trip ${i + 1}. Skipping...`)
          continue
        }

        // Erstelle den Trip in der Datenbank
        const tripResult = await db.execute({
          sql: `
            INSERT INTO trips (start_date, end_date, total_distance)
            VALUES (?, ?, ?)
            RETURNING id
          `,
          args: [trip.startDate, trip.endDate, totalDistance],
        })

        const tripId = tripResult.rows[0].id

        // Aktualisiere die Besuche mit der trip_id
        for (const visit of trip.visits) {
          await db.execute({
            sql: `
              UPDATE visits
              SET trip_id = ?
              WHERE id = ?
            `,
            args: [tripId, visit.id],
          })
        }

        console.log(`Trip ${i + 1} processed: ${totalDistance}km`)
      } catch (error) {
        console.error(`Error processing trip ${i + 1}:`, error)
        // Log additional error details
        console.error("Trip details:", {
          startDate: trip.startDate,
          endDate: trip.endDate,
          visitCount: trip.visits.length,
          visits: trip.visits.map(v => ({
            id: v.id,
            coordinates: [v.longitude, v.latitude]
          }))
        })
        continue
      }
    }

    console.log("\nMigration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  }
}

// Führe die Migration aus
migrateTrips()

