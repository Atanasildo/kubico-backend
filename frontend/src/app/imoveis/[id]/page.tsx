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
          <div className="card p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-primary-900 dark:text-slate-100">
              Características
            </h2>

            {/* Dimensões */}
            {(() => {
              const dims = [
                { value: property.area_m2 ? `${property.area_m2}m²` : null, label: "Área", icon: <Maximize2 className="h-5 w-5 text-primary-600 dark:text-primary-400" /> },
                { value: property.andares != null ? `${property.andares}º` : null, label: "Andar", icon: <span className="text-base leading-none">🏢</span> },
              ].filter(d => d.value);
              return dims.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {dims.map(d => (
                    <div key={d.label} className="flex items-center gap-2 rounded-xl bg-surface-muted dark:bg-dark-elevated p-3">
                      {d.icon}
                      <div>
                        <div className="text-sm font-semibold text-primary-900 dark:text-slate-100">{d.value}</div>
                        <div className="text-xs text-primary-500 dark:text-slate-400">{d.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

            {/* Divisões */}
            {(() => {
              const divisoes = [
                { key: "quartos",     label: "Quartos",        icon: "🛏️" },
                { key: "casas_banho", label: "Casas de banho", icon: "🚿" },
                { key: "cozinhas",    label: "Cozinhas",       icon: "🍳" },
                { key: "salas",       label: "Salas",          icon: "🛋️" },
                { key: "varandas",    label: "Varandas",       icon: "🌿" },
                { key: "despensas",   label: "Despensas",      icon: "📦" },
                { key: "garagens",    label: "Garagens",       icon: "🚗" },
              ].filter(d => (property as any)[d.key] > 0);
              return divisoes.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {divisoes.map(d => (
                    <div key={d.key} className="flex items-center gap-2 rounded-xl bg-surface-muted dark:bg-dark-elevated p-3">
                      <span className="text-lg leading-none">{d.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-primary-900 dark:text-slate-100">{(property as any)[d.key]}</div>
                        <div className="text-xs text-primary-500 dark:text-slate-400">{d.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

            {/* Piso */}
            {(property as any).piso_tipo && (property as any).piso_tipo !== "outro" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary-500 dark:text-slate-400">Piso:</span>
                <span className="px-3 py-1 rounded-full bg-surface-muted dark:bg-dark-elevated border border-surface-border dark:border-dark-border text-xs font-medium text-primary-700 dark:text-slate-300 capitalize">
                  {(property as any).piso_tipo}
                </span>
              </div>
            )}

            {/* Utilities */}
            {(() => {
              const utils = [
                { key: "tem_energia",      label: "Energia eléctrica" },
                { key: "tem_agua",         label: "Água canalizada"   },
                { key: "tem_gerador",      label: "Gerador"           },
                { key: "tem_fossa_septica",label: "Fossa séptica"     },
              ].filter(u => (property as any)[u.key]);
              return utils.length ? (
                <div>
                  <p className="mb-2 text-xs font-semibold text-primary-500 dark:text-slate-400 uppercase tracking-wide">Utilidades</p>
                  <div className="flex flex-wrap gap-2">
                    {utils.map(u => (
                      <div key={u.key} className="flex items-center gap-1.5 rounded-full border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                        <span>✓</span>{u.label}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Comodidades */}
            {(() => {
              const comods = [
                { key: "mobilado",      label: "Mobilado",      icon: "🛋️" },
                { key: "tem_wc_servico",label: "WC de serviço", icon: "🚿" },
                { key: "tem_piscina",   label: "Piscina",       icon: "🏊" },
                { key: "tem_seguranca", label: "Segurança 24h", icon: "🔒" },
                { key: "tem_elevador",  label: "Elevador",      icon: "🛗" },
                { key: "tem_quintal",   label: "Quintal",       icon: "🌳" },
              ].filter(c => (property as any)[c.key]);
              return comods.length ? (
                <div>
                  <p className="mb-2 text-xs font-semibold text-primary-500 dark:text-slate-400 uppercase tracking-wide">Comodidades</p>
                  <div className="flex flex-wrap gap-2">
                    {comods.map(c => (
                      <div key={c.key} className="flex items-center gap-1.5 rounded-full border border-surface-border dark:border-dark-border bg-white dark:bg-dark-elevated px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-slate-200">
                        <span>{c.icon}</span>{c.label}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
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
