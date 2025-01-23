"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, Tent, LayoutGrid, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format, parse } from "date-fns";

interface Visit {
  id: string;
  dateFrom: string;
  dateTo: string;
  campsiteName: string;
  teaserImage: string;
}

const ITEMS_PER_PAGE = 12;

// Update the formatDate function to be more defensive
const formatDate = (dateStr: string) => {
  if (!dateStr) return "";

  try {
    // Check if the date is already in DD.MM.YYYY format
    if (dateStr.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      return dateStr;
    }

    // If not, try to parse and format it
    const parsedDate = parse(dateStr, "dd.MM.yyyy", new Date());
    if (isNaN(parsedDate.getTime())) {
      throw new Error("Invalid date");
    }
    return format(parsedDate, "dd.MM.yyyy");
  } catch (error) {
    console.error("Error formatting date:", dateStr, error);
    return dateStr; // Return original string if parsing fails
  }
};

export default function VisitsAdminPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isGridView, setIsGridView] = useState(true);

  useEffect(() => {
    async function fetchVisits() {
      try {
        const response = await fetch("/api/visits");
        if (!response.ok) {
          throw new Error("Failed to fetch visits");
        }
        const data = await response.json();
        console.log(
          "Received date format example:",
          data[0]?.dateFrom,
          data[0]?.dateTo
        );
        setVisits(data);
      } catch (err) {
        setError("Fehler beim Abrufen der Besuche.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchVisits();
  }, []);

  const filteredVisits = visits.filter(
    (visit) =>
      visit.campsiteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.dateFrom.includes(searchTerm) ||
      visit.dateTo.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredVisits.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVisits = filteredVisits.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {paginatedVisits.map((visit) => (
        <Link
          key={visit.id}
          href={`/admin/visits/${visit.id}`}
          className="block group"
        >
          <Card className="overflow-hidden transition-all hover:shadow-lg">
            <div className="aspect-video relative overflow-hidden">
              {visit.teaserImage ? (
                <img
                  src={`https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/${visit.teaserImage}.webp`}
                  alt={`Besuch bei ${visit.campsiteName}`}
                  loading="lazy"
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Tent className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-2 group-hover:text-primary min-h-[3rem]">
                {visit.campsiteName}
              </CardTitle>
              <div className="space-y-2 text-muted-foreground text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>
                    {formatDate(visit.dateFrom)} – {formatDate(visit.dateTo)}
                  </span>
                </div>
                <div className="flex items-center">
                  <Tent className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">{visit.campsiteName}</span>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );

  const ListView = () => (
    <div className="space-y-4">
      {paginatedVisits.map((visit) => (
        <Link
          key={visit.id}
          href={`/admin/visits/${visit.id}`}
          className="block group"
        >
          <Card className="overflow-hidden transition-all hover:shadow-lg">
            <div className="flex">
              <div className="w-48 h-32 flex-shrink-0 relative overflow-hidden">
                {visit.teaserImage ? (
                  <img
                    src={`https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/${visit.teaserImage}.webp`}
                    alt={`Besuch bei ${visit.campsiteName}`}
                    loading="lazy"
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Tent className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-grow p-4">
                <h3 className="text-lg font-semibold group-hover:text-primary mb-2">
                  {visit.campsiteName}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>
                      {formatDate(visit.dateFrom)} – {formatDate(visit.dateTo)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Tent className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>{visit.campsiteName}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="font-crete text-3xl font-bold tracking-tight">
            Besuche
          </h1>
          <p className="text-muted-foreground">
            {filteredVisits.length}{" "}
            {filteredVisits.length === 1 ? "Besuch" : "Besuche"} gefunden
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suche nach Platz oder Datum..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Toggle
              pressed={isGridView}
              onPressedChange={setIsGridView}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={!isGridView}
              onPressedChange={(pressed) => setIsGridView(!pressed)}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video w-full">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredVisits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? "Keine Besuche gefunden, die Ihrer Suche entsprechen."
                : "Keine Besuche gefunden."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {isGridView ? <GridView /> : <ListView />}

          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((page) => Math.max(1, page - 1));
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(i + 1);
                    }}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((page) => Math.min(totalPages, page + 1));
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}
    </div>
  );
}
