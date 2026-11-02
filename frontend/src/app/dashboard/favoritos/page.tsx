"use client";

import { useEffect, useState } from "react";
import { favoritesApi } from "@/lib/api";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyListItem } from "@/types";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    favoritesApi.list().then(({ data }) => {
      setFavorites(data.items?.map((f: any) => f.imovel) ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const handleFavChange = (id: string, fav: boolean) => {
    if (!fav) setFavorites(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-primary-950">
        Imóveis guardados
      </h1>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-2xl bg-surface-muted animate-pulse" />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Heart className="mb-3 h-12 w-12 text-primary-200" />
          <p className="font-medium text-primary-700">Nenhum imóvel guardado ainda.</p>
          <Link href="/imoveis" className="btn-primary mt-4">
            Explorar imóveis
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map(p => (
            <PropertyCard key={p.id} property={p} isFavorited onFavoriteChange={handleFavChange} />
          ))}
        </div>
      )}
    </div>
  );
}
