import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Sidebar from "./_components/Sidebar";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "../providers";
import "./admin.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Überprüfe die Authentifizierung
  const session = await getServerSession(authOptions);

  if (!session) {
    // Wenn nicht eingeloggt, zeige eine Fehlermeldung und einen Link zur Login-Seite
    return (
      <html lang="de">
        <body className="h-screen bg-background-custom">
          <Providers>
            <div className="flex items-center justify-center h-screen">
              <p className="text-red-500">
                Zugriff verweigert. Bitte einloggen.
              </p>
              <Link href="/login" className="text-blue-500 underline ml-2">
                Zur Login-Seite
              </Link>
              <Toaster />
            </div>
          </Providers>
        </body>
      </html>
    );
  }

  // Wenn eingeloggt, zeige das Admin-Layout
  return (
    <html lang="de">
      <body className="h-screen bg-background-custom">
        <Providers>
          <div className="flex h-screen">
            {/* Sidebar links */}
            <div className="w-72 flex-shrink-0 bg-gray-900">
              <Sidebar />
            </div>
            {/* Hauptinhalt */}
            <div className="flex-1 overflow-auto  bg-[#1E2D2F] p-6">
              {children}
            </div>
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
