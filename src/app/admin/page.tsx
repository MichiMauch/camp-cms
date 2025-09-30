import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VisitedPlacesMap } from "@/components/VisitedPlacesMap";
import {
  TotalVisitedPlaces,
  TotalVisits,
  CampsitesByCountry,
} from "@/components/Statistics";

export default async function Admin() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Zugriff verweigert. Bitte einloggen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-crete text-2xl font-bold tracking-tight">
            Willkommen zurück, {session.user?.name}
          </h1>
          <p className="text-muted-foreground">
            Hier ist eine Übersicht der wichtigsten Informationen
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TotalVisits />
        <TotalVisitedPlaces />
        <div className="md:col-span-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">🧠 AI Trip Planner</h3>
            <p className="text-blue-100 mb-4">Plan your next adventure with AI assistance</p>
            <a
              href="/admin/trip-planner"
              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium"
            >
              ✨ Plan Trip to Czech Republic
            </a>
          </div>
        </div>
      </div>

      <VisitedPlacesMap />

      <CampsitesByCountry />
    </div>
  );
}
