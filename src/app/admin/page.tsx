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
      </div>

      <VisitedPlacesMap />

      <CampsitesByCountry />
    </div>
  );
}
