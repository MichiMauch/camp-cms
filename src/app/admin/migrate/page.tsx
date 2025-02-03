"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MigrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    message?: string;
    error?: string;
    processed?: number;
    total?: number;
  } | null>(null);

  const startMigration = async () => {
    if (!confirm("Sind Sie sicher, dass Sie die Migration starten möchten?")) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/migrate");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Migration failed");
      }

      setResult(data);
    } catch (error) {
      setResult({
        error:
          error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Trip Migration</CardTitle>
          <CardDescription>
            Dieser Prozess erstellt Trips aus den vorhandenen Besuchen und
            berechnet die Gesamtdistanzen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={startMigration} disabled={isLoading}>
            {isLoading ? "Migration läuft..." : "Migration starten"}
          </Button>

          {result && (
            <div className={result.error ? "text-red-500" : "text-green-500"}>
              {result.error ? (
                <p>Error: {result.error}</p>
              ) : (
                <div>
                  <p>{result.message}</p>
                  {result.processed !== undefined && (
                    <p>
                      {result.processed} von {result.total} Trips verarbeitet
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
