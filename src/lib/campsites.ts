export interface Campsite {
    id: number;
    name: string;
    location: string;
    teaser_image: string;
    latitude: number;
    longitude: number;
  }
  
  export async function getCampsites(): Promise<Campsite[]> {
    try {
      const response = await fetch('/api/campsites');
      if (!response.ok) {
        throw new Error('Failed to fetch campsites');
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch campsites:", error);
      return [];
    }
  }