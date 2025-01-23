// Entferne die doppelten Importe
// import { fetchAddress, fetchGroupedAttractions, calculateDistance } from './sharedUtils';

// Entferne die Funktionen, da sie jetzt in `page.tsx` verschoben wurden
// export const fetchAddress = async (latitude: number, longitude: number) => {
//   try {
//     console.log("Fetching address for coordinates:", { latitude, longitude });
//     const response = await fetch(
//       `/api/nominatim?latitude=${latitude}&longitude=${longitude}`
//     );
//     if (!response.ok) {
//       throw new Error("Fehler bei der Nominatim-API-Anfrage.");
//     }
//     const data = await response.json();
//     console.log("Fetched address:", data);
//     return data;
//   } catch (err) {
//     console.error(err);
//     return "Fehler bei der Adresse.";
//   }
// };

// export const fetchGroupedAttractions = async (
//   latitude: number,
//   longitude: number
// ) => {
//   try {
//     console.log("Fetching grouped attractions for coordinates:", { latitude, longitude });
//     const url = `/api/overpass?latitude=${latitude}&longitude=${longitude}`;
//     console.log("Overpass API URL:", url);
//     const response = await fetch(url);
//     console.log("Overpass API Response Status:", response.status);
//     if (!response.ok) {
//       throw new Error("Fehler bei der Overpass-API-Anfrage.");
//     }
//     const data = await response.json();
//     console.log("Fetched grouped attractions:", data);

//     const groupedAttractions: {
//       hikingRoutes: string[];
//       bicycleRoutes: string[];
//       mtbRoutes: string[];
//       attractions: { name: string; distance: string }[];
//     } = {
//       hikingRoutes: [],
//       bicycleRoutes: [],
//       mtbRoutes: [],
//       attractions: [],
//     };

//     for (const element of data.elements) {
//       const { tags, lat, lon } = element;
//       const distance =
//         lat && lon ? calculateDistance(lat, lon, latitude, longitude) : null;

//       if (
//         tags?.route === "hiking" &&
//         tags.name &&
//         tags.name !== "Unbenannt"
//       ) {
//         groupedAttractions.hikingRoutes.push(tags.name);
//       } else if (
//         tags?.route === "bicycle" &&
//         tags.name &&
//         tags.name !== "Unbenannt"
//       ) {
//         groupedAttractions.bicycleRoutes.push(tags.name);
//       } else if (
//         tags?.route === "mtb" &&
//         tags.name &&
//         tags.name !== "Unbenannt"
//       ) {
//         groupedAttractions.mtbRoutes.push(tags.name);
//       } else if (
//         tags?.tourism === "attraction" &&
//         tags.name &&
//         tags.name !== "Unbenannte Attraktion"
//       ) {
//         groupedAttractions.attractions.push({
//           name: tags.name,
//           distance: distance ? `${distance} km` : "Entfernung unbekannt",
//         });
//       }
//     }

//     return groupedAttractions;
//   } catch (err) {
//     console.error(err);
//     return {
//       hikingRoutes: [],
//       bicycleRoutes: [],
//       mtbRoutes: [],
//       attractions: [],
//     };
//   }
// };

// export const calculateDistance = (
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ) => {
//   const R = 6371; // Radius of the Earth in km
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return (R * c).toFixed(2); // Distance in km
// };
