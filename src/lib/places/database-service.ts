import { db } from '@/lib/turso'
import type { DiscoveredPlace } from '@/types/places'

export interface DatabasePlace extends DiscoveredPlace {
  id: number
  region: string
  created_at: string
  updated_at: string
}

export class PlaceDatabaseService {
  /**
   * Save multiple discovered places to the database
   */
  async savePlaces(places: DiscoveredPlace[], region: string): Promise<DatabasePlace[]> {
    const savedPlaces: DatabasePlace[] = []

    for (const place of places) {
      try {
        // First check for exact name and region match (fast check)
        let existingPlace = await this.findByNameAndRegion(place.name, region)

        // If no exact match, check for potential duplicates using advanced detection
        if (!existingPlace) {
          const potentialDuplicates = await this.findPotentialDuplicates(place, region)

          if (potentialDuplicates.length > 0) {
            // Use the best match (highest score) as the existing place
            existingPlace = potentialDuplicates[0]
            console.log(`Potential duplicate found for "${place.name}": "${existingPlace.name}" (advanced matching)`)
          }
        }

        if (existingPlace) {
          // Update existing place with new information
          const updatedPlace = await this.updatePlace(existingPlace.id, place)
          savedPlaces.push(updatedPlace)
          console.log(`Updated existing place: ${existingPlace.name}`)
        } else {
          // Create new place
          const newPlace = await this.createPlace(place, region)
          savedPlaces.push(newPlace)
          console.log(`Created new place: ${place.name}`)
        }
      } catch (error) {
        console.error(`Failed to save place ${place.name}:`, error)
        // Continue with other places even if one fails
      }
    }

    return savedPlaces
  }

  /**
   * Create a new place in the database
   */
  async createPlace(place: DiscoveredPlace, region: string): Promise<DatabasePlace> {
    const result = await db.execute({
      sql: `
        INSERT INTO discovered_places (
          name, description, why_interesting, category, location,
          estimated_visit_duration, best_time_to_visit, practical_tips,
          latitude, longitude, region, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        RETURNING *
      `,
      args: [
        place.name,
        place.description || null,
        place.why_interesting || null,
        place.category || null,
        place.location || null,
        place.estimated_visit_duration || null,
        place.best_time_to_visit || null,
        place.practical_tips || null,
        place.latitude || null,
        place.longitude || null,
        region
      ]
    })

    if (!result.rows[0]) {
      throw new Error('Failed to create place')
    }

    return this.mapRowToPlace(result.rows[0])
  }

  /**
   * Update an existing place
   */
  async updatePlace(id: number, place: DiscoveredPlace): Promise<DatabasePlace> {
    const result = await db.execute({
      sql: `
        UPDATE discovered_places SET
          description = ?, why_interesting = ?, category = ?, location = ?,
          estimated_visit_duration = ?, best_time_to_visit = ?, practical_tips = ?,
          latitude = ?, longitude = ?, updated_at = datetime('now')
        WHERE id = ?
        RETURNING *
      `,
      args: [
        place.description || null,
        place.why_interesting || null,
        place.category || null,
        place.location || null,
        place.estimated_visit_duration || null,
        place.best_time_to_visit || null,
        place.practical_tips || null,
        place.latitude || null,
        place.longitude || null,
        id
      ]
    })

    if (!result.rows[0]) {
      throw new Error('Failed to update place')
    }

    return this.mapRowToPlace(result.rows[0])
  }

  /**
   * Find a place by name and region
   */
  async findByNameAndRegion(name: string, region: string): Promise<DatabasePlace | null> {
    const result = await db.execute({
      sql: 'SELECT * FROM discovered_places WHERE name = ? AND region = ? LIMIT 1',
      args: [name, region]
    })

    if (!result.rows[0]) {
      return null
    }

    return this.mapRowToPlace(result.rows[0])
  }

  /**
   * Advanced duplicate detection using multiple criteria
   */
  async findPotentialDuplicates(place: DiscoveredPlace, region: string): Promise<DatabasePlace[]> {
    // Get all places in the same region for comparison
    const existingPlaces = await this.getPlacesByRegion(region)
    const potentialDuplicates: Array<DatabasePlace & { score: number }> = []

    for (const existing of existingPlaces) {
      let score = 0
      let matches = 0

      // 1. Name similarity (fuzzy matching)
      const nameSimilarity = this.calculateStringSimilarity(
        place.name.toLowerCase().trim(),
        existing.name.toLowerCase().trim()
      )
      if (nameSimilarity > 0.8) {
        score += nameSimilarity * 40 // High weight for name similarity
        matches++
      }

      // 2. Coordinate proximity (if both have coordinates)
      if (place.latitude && place.longitude && existing.latitude && existing.longitude) {
        const distance = this.calculateDistance(
          place.latitude, place.longitude,
          existing.latitude, existing.longitude
        )
        // Within 100 meters is considered very likely duplicate
        if (distance <= 0.1) {
          score += 35
          matches++
        } else if (distance <= 0.5) { // Within 500 meters is still suspicious
          score += 15
          matches++
        }
      }

      // 3. Description similarity (if both have descriptions)
      if (place.description && existing.description) {
        const descSimilarity = this.calculateStringSimilarity(
          place.description.toLowerCase().trim(),
          existing.description.toLowerCase().trim()
        )
        if (descSimilarity > 0.7) {
          score += descSimilarity * 20
          matches++
        }
      }

      // 4. Category match
      if (place.category && existing.category &&
          place.category.toLowerCase() === existing.category.toLowerCase()) {
        score += 10
        matches++
      }

      // 5. Location string similarity (if both have location)
      if (place.location && existing.location) {
        const locationSimilarity = this.calculateStringSimilarity(
          place.location.toLowerCase().trim(),
          existing.location.toLowerCase().trim()
        )
        if (locationSimilarity > 0.8) {
          score += locationSimilarity * 15
          matches++
        }
      }

      // Consider it a potential duplicate if score is high enough
      // and we have at least 2 matching criteria
      if (score > 60 && matches >= 2) {
        potentialDuplicates.push({ ...existing, score })
      }
    }

    // Sort by score (highest first) and return the places without score
    return potentialDuplicates
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...place }) => place)
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (str1.length === 0 || str2.length === 0) return 0.0

    // Create matrix
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    )

    // Initialize first row and column
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    // Fill matrix
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    // Calculate similarity (1 - normalized distance)
    const maxLength = Math.max(str1.length, str2.length)
    return 1 - (matrix[str2.length][str1.length] / maxLength)
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(value: number): number {
    return value * Math.PI / 180
  }

  /**
   * Get all places for a specific region
   */
  async getPlacesByRegion(region: string): Promise<DatabasePlace[]> {
    const result = await db.execute({
      sql: 'SELECT * FROM discovered_places WHERE region = ? ORDER BY created_at DESC',
      args: [region]
    })

    return result.rows.map(row => this.mapRowToPlace(row))
  }

  /**
   * Get all places with optional filters
   */
  async getPlaces(filters?: {
    region?: string
    category?: string
    limit?: number
  }): Promise<DatabasePlace[]> {
    let sql = 'SELECT * FROM discovered_places WHERE 1=1'
    const args: any[] = []

    if (filters?.region) {
      sql += ' AND region = ?'
      args.push(filters.region)
    }

    if (filters?.category) {
      sql += ' AND category = ?'
      args.push(filters.category)
    }

    sql += ' ORDER BY created_at DESC'

    if (filters?.limit) {
      sql += ' LIMIT ?'
      args.push(filters.limit)
    }

    const result = await db.execute({ sql, args })
    return result.rows.map(row => this.mapRowToPlace(row))
  }

  /**
   * Delete a place by ID
   */
  async deletePlace(id: number): Promise<boolean> {
    const result = await db.execute({
      sql: 'DELETE FROM discovered_places WHERE id = ?',
      args: [id]
    })

    return result.rowsAffected > 0
  }

  /**
   * Get statistics about saved places
   */
  async getStatistics(): Promise<{
    totalPlaces: number
    regionsCount: number
    categoriesCount: number
    recentPlaces: number
  }> {
    const [totalResult, regionsResult, categoriesResult, recentResult] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM discovered_places'),
      db.execute('SELECT COUNT(DISTINCT region) as count FROM discovered_places'),
      db.execute('SELECT COUNT(DISTINCT category) as count FROM discovered_places'),
      db.execute("SELECT COUNT(*) as count FROM discovered_places WHERE created_at > datetime('now', '-7 days')")
    ])

    return {
      totalPlaces: Number(totalResult.rows[0]?.count || 0),
      regionsCount: Number(regionsResult.rows[0]?.count || 0),
      categoriesCount: Number(categoriesResult.rows[0]?.count || 0),
      recentPlaces: Number(recentResult.rows[0]?.count || 0)
    }
  }

  /**
   * Map database row to DatabasePlace object
   */
  private mapRowToPlace(row: any): DatabasePlace {
    return {
      id: Number(row.id),
      name: String(row.name),
      description: row.description ? String(row.description) : '',
      why_interesting: row.why_interesting ? String(row.why_interesting) : '',
      category: row.category ? String(row.category) : '',
      location: row.location ? String(row.location) : undefined,
      estimated_visit_duration: row.estimated_visit_duration ? String(row.estimated_visit_duration) : undefined,
      best_time_to_visit: row.best_time_to_visit ? String(row.best_time_to_visit) : undefined,
      practical_tips: row.practical_tips ? String(row.practical_tips) : undefined,
      latitude: row.latitude ? Number(row.latitude) : undefined,
      longitude: row.longitude ? Number(row.longitude) : undefined,
      region: String(row.region),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at)
    }
  }
}