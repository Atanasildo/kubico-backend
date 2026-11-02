"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bed, Bath, Maximize2, Star } from "lucide-react";
import { PropertyListItem } from "@/types";
import { formatPrice, tipoNegocioLabel, tipoImovelLabel, getFirstImage, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { favoritesApi } from "@/lib/api";
import { useState } from "react";

interface Props {
  property: PropertyListItem;
  isFavorited?: boolean;
  onFavoriteChange?: (id: string, fav: boolean) => void;
}

export function PropertyCard({ property, isFavorited = false, onFavoriteChange }: Props) {
  const [fav, setFav] = useState(isFavorited);
  const [toggling, setToggling] = useState(false);

  const isDestaque =
    property.destaque_ate && new Date(property.destaque_ate) > new Date();

  const handleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;
    setToggling(true);
    try {
      await favoritesApi.toggle(property.id);
      setFav(!fav);
      onFavoriteChange?.(property.id, !fav);
    } catch {
      // silently fail if not authenticated
    } finally {
      setToggling(false);
    }
  };

  return (
    <Link
      href={`/imoveis/${property.id}`}
      className={cn(
        "card group block overflow-hidden",
        isDestaque && "ring-2 ring-terra-400"
      )}
    >
      {/* Image */}
      <div className="relative h-52 w-full overflow-hidden bg-surface-muted">
        <Image
          src={getFirstImage(property.imagens)}
          alt={property.titulo}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-lg bg-primary-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {tipoNegocioLabel(property.tipo_negocio)}
          </span>
          {isDestaque && (
            <span className="badge-destaque backdrop-blur-sm">
              <Star className="h-3 w-3" />
              Destaque
            </span>
          )}
          {property.verificado && (
            <span className="badge-verificado backdrop-blur-sm">
              ✓ Verificado
            </span>
          )}
        </div>

        {/* Favorite */}
        <button
          onClick={handleFav}
          className={cn(
            "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-all hover:scale-110",
            fav ? "text-red-500" : "text-primary-400"
          )}
        >
          <Heart className={cn("h-4 w-4", fav && "fill-current")} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-display text-lg font-bold text-primary-900">
            {formatPrice(property.preco, property.moeda)}
            {property.tipo_negocio === "arrendamento" && (
              <span className="ml-1 text-xs font-normal text-primary-500">/mês</span>
            )}
          </span>
          <span className="text-xs text-primary-400">{timeAgo(property.criado_em)}</span>
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-1 text-sm font-semibold text-primary-900 group-hover:text-primary-600 transition-colors">
          {property.titulo}
        </h3>

        {/* Location */}
        <p className="mb-3 flex items-center gap-1 text-xs text-primary-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">
            {property.bairro ? `${property.bairro}, ` : ""}
            {property.municipio}, {property.provincia}
          </span>
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-primary-600">
          <span className="rounded-lg bg-primary-50 px-2 py-1">
            {tipoImovelLabel(property.tipo_imovel)}
          </span>
          {property.quartos != null && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {property.quartos}
            </span>
          )}
          {property.casas_banho != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.casas_banho}
            </span>
          )}
          {property.area_m2 && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5" />
              {property.area_m2}m²
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
