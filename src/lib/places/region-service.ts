// Region Service - Predefined list of regions/countries

import type { Region } from '@/types/places'

export const regions: Region[] = [
  // Europe
  { code: 'AT', name: 'Austria', continent: 'Europe' },
  { code: 'BE', name: 'Belgium', continent: 'Europe' },
  { code: 'CZ', name: 'Czech Republic', continent: 'Europe' },
  { code: 'DK', name: 'Denmark', continent: 'Europe' },
  { code: 'FI', name: 'Finland', continent: 'Europe' },
  { code: 'FR', name: 'France', continent: 'Europe' },
  { code: 'DE', name: 'Germany', continent: 'Europe' },
  { code: 'GR', name: 'Greece', continent: 'Europe' },
  { code: 'HU', name: 'Hungary', continent: 'Europe' },
  { code: 'IS', name: 'Iceland', continent: 'Europe' },
  { code: 'IE', name: 'Ireland', continent: 'Europe' },
  { code: 'IT', name: 'Italy', continent: 'Europe' },
  { code: 'NL', name: 'Netherlands', continent: 'Europe' },
  { code: 'NO', name: 'Norway', continent: 'Europe' },
  { code: 'PL', name: 'Poland', continent: 'Europe' },
  { code: 'PT', name: 'Portugal', continent: 'Europe' },
  { code: 'RO', name: 'Romania', continent: 'Europe' },
  { code: 'SK', name: 'Slovakia', continent: 'Europe' },
  { code: 'SI', name: 'Slovenia', continent: 'Europe' },
  { code: 'ES', name: 'Spain', continent: 'Europe' },
  { code: 'SE', name: 'Sweden', continent: 'Europe' },
  { code: 'CH', name: 'Switzerland', continent: 'Europe' },
  { code: 'GB', name: 'United Kingdom', continent: 'Europe' },

  // German States
  { code: 'DE-BY', name: 'Bavaria, Germany', continent: 'Europe' },
  { code: 'DE-BW', name: 'Baden-Württemberg, Germany', continent: 'Europe' },
  { code: 'DE-NW', name: 'North Rhine-Westphalia, Germany', continent: 'Europe' },
  { code: 'DE-SN', name: 'Saxony, Germany', continent: 'Europe' },

  // North America
  { code: 'CA', name: 'Canada', continent: 'North America' },
  { code: 'US', name: 'United States', continent: 'North America' },
  { code: 'MX', name: 'Mexico', continent: 'North America' },

  // Asia
  { code: 'JP', name: 'Japan', continent: 'Asia' },
  { code: 'KR', name: 'South Korea', continent: 'Asia' },
  { code: 'TH', name: 'Thailand', continent: 'Asia' },
  { code: 'VN', name: 'Vietnam', continent: 'Asia' },
  { code: 'CN', name: 'China', continent: 'Asia' },
  { code: 'IN', name: 'India', continent: 'Asia' },

  // Oceania
  { code: 'AU', name: 'Australia', continent: 'Oceania' },
  { code: 'NZ', name: 'New Zealand', continent: 'Oceania' },

  // South America
  { code: 'BR', name: 'Brazil', continent: 'South America' },
  { code: 'AR', name: 'Argentina', continent: 'South America' },
  { code: 'CL', name: 'Chile', continent: 'South America' },
  { code: 'PE', name: 'Peru', continent: 'South America' },

  // Africa
  { code: 'ZA', name: 'South Africa', continent: 'Africa' },
  { code: 'MA', name: 'Morocco', continent: 'Africa' },
  { code: 'EG', name: 'Egypt', continent: 'Africa' },
  { code: 'KE', name: 'Kenya', continent: 'Africa' }
]

export class RegionService {
  static getAllRegions(): Region[] {
    return regions
  }

  static getRegionsByContinent(continent: string): Region[] {
    return regions.filter(region => region.continent === continent)
  }

  static searchRegions(query: string): Region[] {
    const searchTerm = query.toLowerCase()
    return regions.filter(region =>
      region.name.toLowerCase().includes(searchTerm) ||
      region.code.toLowerCase().includes(searchTerm)
    )
  }

  static getRegionByCode(code: string): Region | undefined {
    return regions.find(region => region.code === code)
  }
}