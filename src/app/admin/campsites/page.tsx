"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, LayoutGrid, List } from "lucide-react";
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

interface Campsite {
  id: string;
  name: string;
  location: string;
  teaser_image: string;
}

const ITEMS_PER_PAGE = 12;

export default function CampsitesAdminPage() {
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isGridView, setIsGridView] = useState(true);

  useEffect(() => {
    async function fetchCampsites() {
      try {
        const response = await fetch("/api/campsites");
        if (!response.ok) {
          throw new Error("Failed to fetch campsites");
        }
        const data = await response.json();
        setCampsites(data);
      } catch (err) {
        setError("Fehler beim Abrufen der Campingplätze.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCampsites();
  }, []);

  const filteredCampsites = campsites.filter(
    (campsite) =>
      campsite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campsite.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCampsites.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCampsites = filteredCampsites.slice(
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
      {paginatedCampsites.map((campsite) => (
        <Link
          key={campsite.id}
          href={`/admin/campsites/${campsite.id}`}
          className="block group"
        >
          <Card className="overflow-hidden transition-all hover:shadow-lg">
            <div className="aspect-video relative overflow-hidden">
              <img
                src={`https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/${campsite.teaser_image}.webp`}
                alt={`${campsite.name} Teaser`}
                loading="lazy"
                className="object-cover w-full h-full transition-transform group-hover:scale-105"
              />
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-2 group-hover:text-primary min-h-[3rem]">
                {campsite.name}
              </CardTitle>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{campsite.location}</span>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );

  const ListView = () => (
    <div className="space-y-4">
      {paginatedCampsites.map((campsite) => (
        <Link
          key={campsite.id}
          href={`/admin/campsites/${campsite.id}`}
          className="block group"
        >
          <Card className="overflow-hidden transition-all hover:shadow-lg">
            <div className="flex">
              <div className="w-48 h-32 flex-shrink-0 relative overflow-hidden">
                <img
                  src={`https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/${campsite.teaser_image}.webp`}
                  alt={`${campsite.name} Teaser`}
                  loading="lazy"
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex-grow p-4">
                <h3 className="text-lg font-semibold group-hover:text-primary mb-2">
                  {campsite.name}
                </h3>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{campsite.location}</span>
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
          <h1 className="text-3xl font-bold tracking-tight">
            Besuchte Campingplätze
          </h1>
          <p className="text-muted-foreground">
            {filteredCampsites.length}{" "}
            {filteredCampsites.length === 1 ? "Platz" : "Plätze"} gefunden
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suche nach Name oder Ort..."
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
      ) : filteredCampsites.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? "Keine Campingplätze gefunden, die Ihrer Suche entsprechen."
                : "Keine besuchten Campingplätze gefunden."}
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
