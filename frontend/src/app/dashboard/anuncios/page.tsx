"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { propertyApi } from "@/lib/api";
import { PropertyListItem } from "@/types";
import { formatPrice, tipoNegocioLabel, tipoImovelLabel, timeAgo } from "@/lib/utils";
import { Plus, Home, Pencil, Trash2, Eye, ArrowLeft, Star, ShieldCheck } from "lucide-react";

const statusColor: Record<string, string> = {
  ativo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  arrendado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  vendido: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  suspenso: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabel: Record<string, string> = {
  ativo: "Activo",
  arrendado: "Arrendado",
  vendido: "Vendido",
  suspenso: "Suspenso",
};

export default function AnunciosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    propertyApi
      .mine()
      .then(({ data }) => {
        // backend returns list directly (not paginated)
        const list = Array.isArray(data) ? data : (data.items ?? []);
        setProperties(list);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tens a certeza que queres apagar este anúncio?")) return;
    setDeleting(id);
    try {
      await propertyApi.delete(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Erro ao apagar o anúncio. Tenta novamente.");
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-white text-primary-600 shadow-sm hover:bg-surface-muted dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-950 dark:text-white">
            Os meus anúncios
          </h1>
          <p className="text-sm text-primary-500 dark:text-slate-400">
            {properties.length} anúncio{properties.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/publicar" className="btn-primary ml-auto">
          <Plus className="h-4 w-4" />
          Publicar novo
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-surface-muted animate-pulse dark:bg-dark-surface" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center dark:bg-dark-card dark:border-dark-border">
          <Home className="mb-3 h-12 w-12 text-primary-300" />
          <p className="font-medium text-primary-700 dark:text-slate-300">
            Ainda não publicaste nenhum anúncio.
          </p>
          <p className="mt-1 text-sm text-primary-400 dark:text-slate-500">
            Começa agora — é rápido e gratuito.
          </p>
          <Link href="/dashboard/publicar" className="btn-primary mt-5">
            <Plus className="h-4 w-4" />
            Publicar agora
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <div
              key={p.id}
              className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center dark:bg-dark-card dark:border-dark-border"
            >
              {/* Thumbnail */}
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-surface-muted dark:bg-dark-surface">
                {p.imagens && p.imagens.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imagens[0]}
                    alt={p.titulo}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Home className="h-7 w-7 text-primary-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <h3 className="line-clamp-1 text-sm font-semibold text-primary-900 dark:text-white">
                    {p.titulo}
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[p.status] ?? ""}`}>
                    {statusLabel[p.status] ?? p.status}
                  </span>
                  {p.verificado && (
                    <span className="flex items-center gap-0.5 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      <ShieldCheck className="h-3 w-3" />
                      Verificado
                    </span>
                  )}
                  {p.destaque_ate && new Date(p.destaque_ate) > new Date() && (
                    <span className="flex items-center gap-0.5 rounded-full bg-terra-100 px-2 py-0.5 text-xs font-medium text-terra-700 dark:bg-terra-900/30 dark:text-terra-300">
                      <Star className="h-3 w-3" />
                      Destaque
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-primary-700 dark:text-terra-400">
                  {formatPrice(p.preco, p.moeda)}
                  {p.tipo_negocio === "arrendamento" && (
                    <span className="ml-1 text-xs font-normal text-primary-400">/mês</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-primary-400 dark:text-slate-500">
                  {tipoNegocioLabel(p.tipo_negocio)} · {tipoImovelLabel(p.tipo_imovel)} ·{" "}
                  {p.municipio}, {p.provincia} · {timeAgo(p.criado_em)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/imoveis/${p.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-surface-border bg-white text-primary-500 hover:bg-surface-muted dark:border-dark-border dark:bg-dark-elevated dark:text-slate-300 dark:hover:bg-dark-card transition-colors"
                  title="Ver anúncio"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <Link
                  href={`/dashboard/publicar?edit=${p.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-surface-border bg-white text-primary-500 hover:bg-surface-muted dark:border-dark-border dark:bg-dark-elevated dark:text-slate-300 dark:hover:bg-dark-card transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:bg-dark-elevated dark:hover:bg-red-900/20 transition-colors"
                  title="Apagar"
                >
                  {deleting === p.id ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
