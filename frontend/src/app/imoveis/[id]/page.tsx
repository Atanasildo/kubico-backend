"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Bed, Bath, Maximize2, Car, Trees, Heart,
  MessageCircle, Phone, Star, ShieldCheck, Eye,
  ArrowLeft, Share2, Flag,
} from "lucide-react";
import { propertyApi, favoritesApi } from "@/lib/api";
import { Property } from "@/types";
import { formatPrice, tipoNegocioLabel, tipoImovelLabel, timeAgo } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [fav, setFav] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  useEffect(() => {
    propertyApi.get(id).then(({ data }) => {
      setProperty(data);
    }).catch(() => router.push("/imoveis"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (property?.contacto_whatsapp) {
      propertyApi.whatsappLink(id).then(({ data }) => {
        setWhatsappLink(data.link);
      }).catch(() => {});
    }
  }, [property, id]);

  const toggleFav = async () => {
    try {
      await favoritesApi.toggle(id);
      setFav(!fav);
    } catch {}
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="h-80 rounded-2xl bg-surface-muted animate-pulse mb-6" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="h-8 w-2/3 rounded-xl bg-surface-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded-xl bg-surface-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const images = property.imagens?.length ? property.imagens : ["/placeholder-property.svg"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      {/* Image gallery */}
      <div className="mb-6 overflow-hidden rounded-2xl">
        <div className="relative h-72 sm:h-96 bg-surface-muted">
          <Image
            src={images[activeImg]}
            alt={property.titulo}
            fill
            className="object-cover"
            priority
          />
          {property.em_destaque && (
            <span className="absolute left-4 top-4 badge-destaque">
              <Star className="h-3 w-3" />
              Destaque
            </span>
          )}
          {property.verificado && (
            <span className="absolute left-4 top-12 badge-verificado">
              <ShieldCheck className="h-3 w-3" />
              Verificado
            </span>
          )}
          <button
            onClick={toggleFav}
            className={cn(
              "absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all hover:scale-110",
              fav ? "text-red-500" : "text-primary-400"
            )}
          >
            <Heart className={cn("h-5 w-5", fav && "fill-current")} />
          </button>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-2 bg-surface-muted">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition",
                  i === activeImg ? "ring-2 ring-primary-600" : "opacity-70 hover:opacity-100"
                )}
              >
                <Image src={src} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & price */}
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-lg bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white">
                {tipoNegocioLabel(property.tipo_negocio)}
              </span>
              <span className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs font-medium text-primary-700">
                {tipoImovelLabel(property.tipo_imovel)}
              </span>
            </div>

            <h1 className="font-display text-2xl font-bold text-primary-950 sm:text-3xl">
              {property.titulo}
            </h1>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-primary-900">
                {formatPrice(property.preco, property.moeda)}
              </span>
              {property.tipo_negocio === "arrendamento" && (
                <span className="text-sm text-primary-500">/mês</span>
              )}
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-primary-500">
              <MapPin className="h-4 w-4" />
              {[property.bairro, property.municipio, property.provincia]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>

          {/* Characteristics */}
          <div className="card p-5">
            <h2 className="mb-4 font-display text-base font-bold text-primary-900">
              Características
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {property.quartos != null && (
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted p-3">
                  <Bed className="h-5 w-5 text-primary-600" />
                  <div>
                    <div className="text-sm font-semibold text-primary-900">{property.quartos}</div>
                    <div className="text-xs text-primary-500">Quartos</div>
                  </div>
                </div>
              )}
              {property.casas_banho != null && (
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted p-3">
                  <Bath className="h-5 w-5 text-primary-600" />
                  <div>
                    <div className="text-sm font-semibold text-primary-900">{property.casas_banho}</div>
                    <div className="text-xs text-primary-500">Casas banho</div>
                  </div>
                </div>
              )}
              {property.area_m2 && (
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted p-3">
                  <Maximize2 className="h-5 w-5 text-primary-600" />
                  <div>
                    <div className="text-sm font-semibold text-primary-900">{property.area_m2}m²</div>
                    <div className="text-xs text-primary-500">Área</div>
                  </div>
                </div>
              )}
              {property.tem_garagem && (
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted p-3">
                  <Car className="h-5 w-5 text-primary-600" />
                  <div className="text-sm font-semibold text-primary-900">Garagem</div>
                </div>
              )}
              {property.tem_quintal && (
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted p-3">
                  <Trees className="h-5 w-5 text-primary-600" />
                  <div className="text-sm font-semibold text-primary-900">Quintal</div>
                </div>
              )}
              {property.mobilado != null && (
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted p-3">
                  <div className="text-sm font-semibold text-primary-900">
                    {property.mobilado ? "Mobilado" : "Sem mobília"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {property.descricao && (
            <div className="card p-5">
              <h2 className="mb-3 font-display text-base font-bold text-primary-900">
                Descrição
              </h2>
              <p className="text-sm text-primary-700 leading-relaxed whitespace-pre-line">
                {property.descricao}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-primary-400">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {property.visualizacoes} visualizações
            </span>
            <span>Publicado {timeAgo(property.criado_em)}</span>
          </div>
        </div>

        {/* Contact card */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-24">
            {/* Author */}
            {property.autor && (
              <div className="mb-5 flex items-center gap-3 border-b border-surface-border pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-lg">
                  {property.autor.nome[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-primary-900">
                    {property.autor.nome_empresa ?? property.autor.nome}
                  </div>
                  <div className="text-xs text-primary-500 capitalize">
                    {property.autor.role}
                    {property.autor.telefone_verificado && " · ✓ Verificado"}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contactar por WhatsApp
                </a>
              )}
              {property.contacto_telefone && (
                <a
                  href={`tel:${property.contacto_telefone}`}
                  className="btn-secondary w-full justify-center"
                >
                  <Phone className="h-4 w-4" />
                  {property.contacto_telefone}
                </a>
              )}
              <button
                onClick={toggleFav}
                className={cn(
                  "btn-secondary w-full justify-center",
                  fav && "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                )}
              >
                <Heart className={cn("h-4 w-4", fav && "fill-current")} />
                {fav ? "Guardado" : "Guardar"}
              </button>
            </div>

            <div className="mt-4 border-t border-surface-border pt-4 text-center">
              <Link
                href={`/imoveis/${id}/denunciar`}
                className="flex items-center justify-center gap-1 text-xs text-primary-400 hover:text-red-500"
              >
                <Flag className="h-3 w-3" />
                Denunciar anúncio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
