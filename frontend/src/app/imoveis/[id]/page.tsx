"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Bed, Bath, Maximize2, Car, Trees, Heart,
  MessageCircle, Phone, Star, ShieldCheck, Eye,
  ArrowLeft, Flag,
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
        <div className="h-80 rounded-2xl bg-surface-muted dark:bg-dark-muted animate-pulse mb-6" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="h-8 w-2/3 rounded-xl bg-surface-muted dark:bg-dark-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded-xl bg-surface-muted dark:bg-dark-muted animate-pulse" />
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
        className="mb-5 flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      {/* Image gallery */}
      <div className="mb-6 overflow-hidden rounded-2xl">
        <div className="relative h-72 sm:h-96 bg-surface-muted dark:bg-dark-muted">
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
              "absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-dark-elevated/90 backdrop-blur-sm shadow-sm transition-all hover:scale-110",
              fav ? "text-red-500" : "text-primary-400"
            )}
          >
            <Heart className={cn("h-5 w-5", fav && "fill-current")} />
          </button>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-2 bg-surface-muted dark:bg-dark-muted">
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
              <span className="rounded-lg bg-surface-muted dark:bg-dark-elevated px-2.5 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
                {tipoImovelLabel(property.tipo_imovel)}
              </span>
            </div>

            <h1 className="font-display text-2xl font-bold text-primary-950 dark:text-slate-100 sm:text-3xl">
              {property.titulo}
            </h1>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-primary-900 dark:text-slate-100">
                {formatPrice(property.preco, property.moeda)}
              </span>
              {property.tipo_negocio === "arrendamento" && (
                <span className="text-sm text-primary-500 dark:text-slate-400">/mês</span>
              )}
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-primary-500 dark:text-slate-400">
              <MapPin className="h-4 w-4" />
              {[property.bairro, property.municipio, property.provincia]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>

          {/* Characteristics */}
          <div className="card p-5">
            <h2 className="mb-4 font-display text-base font-bold text-primary-900 dark:text-slate-100">
              Características
            </h2>

            {/* Contadores */}
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {property.quartos != null && (
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted dark:bg-dark-elevated p-3">
                  <Bed className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <div className="text-sm font-semibold text-primary-900 dark:text-slate-100">{property.quartos}</div>
                    <div className="text-xs text-primary-500 dark:text-slate-400">Quartos</div>
                  </div>
                </div>
              )}
              {property.casas_banho != null && (
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted dark:bg-dark-elevated p-3">
                  <Bath className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <div className="text-sm font-semibold text-primary-900 dark:text-slate-100">{property.casas_banho}</div>
                    <div className="text-xs text-primary-500 dark:text-slate-400">Casas banho</div>
                  </div>
                </div>
              )}
              {property.area_m2 && (
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted dark:bg-dark-elevated p-3">
                  <Maximize2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <div>
                    <div className="text-sm font-semibold text-primary-900 dark:text-slate-100">{property.area_m2}m²</div>
                    <div className="text-xs text-primary-500 dark:text-slate-400">Área</div>
                  </div>
                </div>
              )}
              {property.andares != null && (
                <div className="flex items-center gap-2 rounded-xl bg-surface-muted dark:bg-dark-elevated p-3">
                  <div className="flex h-5 w-5 items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs">Nº</div>
                  <div>
                    <div className="text-sm font-semibold text-primary-900 dark:text-slate-100">{property.andares}º</div>
                    <div className="text-xs text-primary-500 dark:text-slate-400">Andar</div>
                  </div>
                </div>
              )}
            </div>

            {/* Comodidades booleanas */}
            {(() => {
              const features: { key: keyof typeof property; label: string; icon: React.ReactNode }[] = [
                { key: "mobilado", label: property.mobilado ? "Mobilado" : "Sem mobília", icon: <span className="text-base">🛋️</span> },
                { key: "tem_cozinha", label: "Cozinha", icon: <span className="text-base">🍳</span> },
                { key: "tem_sala", label: "Sala", icon: <span className="text-base">🪑</span> },
                { key: "tem_garagem", label: "Garagem", icon: <Car className="h-4 w-4" /> },
                { key: "tem_quintal", label: "Quintal", icon: <Trees className="h-4 w-4" /> },
                { key: "tem_varanda", label: "Varanda", icon: <span className="text-base">🏠</span> },
                { key: "tem_wc_servico", label: "WC serviço", icon: <span className="text-base">🚿</span> },
                { key: "tem_piscina", label: "Piscina", icon: <span className="text-base">🏊</span> },
                { key: "tem_gerador", label: "Gerador", icon: <span className="text-base">⚡</span> },
                { key: "tem_seguranca", label: "Segurança 24h", icon: <ShieldCheck className="h-4 w-4" /> },
                { key: "tem_elevador", label: "Elevador", icon: <span className="text-base">🛗</span> },
              ];
              const active = features.filter(f => property[f.key]);
              if (!active.length) return null;
              return (
                <div className="flex flex-wrap gap-2 pt-1">
                  {active.map(f => (
                    <div key={String(f.key)} className="flex items-center gap-1.5 rounded-full border border-surface-border dark:border-dark-border bg-white dark:bg-dark-elevated px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-slate-200">
                      <span className="text-primary-500 dark:text-primary-400">{f.icon}</span>
                      {f.label}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Mapa */}
          {property.latitude && property.longitude && (
            <div className="card overflow-hidden p-0">
              <div className="flex items-center gap-2 border-b border-surface-border dark:border-dark-border px-5 py-3">
                <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <h2 className="font-display text-base font-bold text-primary-900 dark:text-slate-100">
                  Localização
                </h2>
              </div>
              <iframe
                title="Localização do imóvel"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(property.longitude) - 0.005},${Number(property.latitude) - 0.005},${Number(property.longitude) + 0.005},${Number(property.latitude) + 0.005}&layer=mapnik&marker=${property.latitude},${property.longitude}`}
                className="h-64 w-full border-0"
                loading="lazy"
              />
              <div className="px-5 py-2.5 text-xs text-primary-400 dark:text-slate-500">
                {[property.bairro, property.municipio, property.provincia].filter(Boolean).join(", ")}
              </div>
            </div>
          )}

          {/* Description */}
          {property.descricao && (
            <div className="card p-5">
              <h2 className="mb-3 font-display text-base font-bold text-primary-900 dark:text-slate-100">
                Descrição
              </h2>
              <p className="text-sm text-primary-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {property.descricao}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-primary-400 dark:text-slate-500">
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
              <div className="mb-5 flex items-center gap-3 border-b border-surface-border dark:border-dark-border pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 dark:bg-dark-elevated text-primary-700 dark:text-primary-300 font-bold text-lg">
                  {property.autor.nome[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-primary-900 dark:text-slate-100">
                    {property.autor.nome_empresa ?? property.autor.nome}
                  </div>
                  <div className="text-xs text-primary-500 dark:text-slate-400 capitalize">
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
                  fav && "border-red-200 dark:border-red-900 text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50"
                )}
              >
                <Heart className={cn("h-4 w-4", fav && "fill-current")} />
                {fav ? "Guardado" : "Guardar"}
              </button>
            </div>

            <div className="mt-4 border-t border-surface-border dark:border-dark-border pt-4 text-center">
              <Link
                href={`/imoveis/${id}/denunciar`}
                className="flex items-center justify-center gap-1 text-xs text-primary-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"
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
