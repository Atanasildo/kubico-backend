"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PropertyCard } from "@/components/property/PropertyCard";
import { SearchBar } from "@/components/property/SearchBar";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { propertyApi } from "@/lib/api";
import { PropertyListItem, TipoNegocio, TipoImovel } from "@/types";
import { tipoImovelLabel, provincias } from "@/lib/utils";

const TIPO_IMOVEL_OPTIONS: TipoImovel[] = [
  "apartamento","casa","terreno","loja","escritorio","armazem","quarto","outro",
];

export default function ImoveisPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(sp.get("page") ?? "1");
  const limit = 12;

  const params = {
    tipo_negocio: sp.get("tipo_negocio") as TipoNegocio | null,
    tipo_imovel: sp.get("tipo_imovel") as TipoImovel | null,
    provincia: sp.get("provincia") ?? "",
    municipio: sp.get("municipio") ?? "",
    preco_max: sp.get("preco_max") ? Number(sp.get("preco_max")) : undefined,
    quartos_min: sp.get("quartos_min") ? Number(sp.get("quartos_min")) : undefined,
    page,
    limit,
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== "" && v !== undefined)
      );
      const { data } = await propertyApi.search(clean);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sp.toString()]);

  useEffect(() => { load(); }, [load]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    router.push(`/imoveis?${p.toString()}`);
  };

  const setPage = (n: number) => {
    const p = new URLSearchParams(sp.toString());
    p.set("page", String(n));
    router.push(`/imoveis?${p.toString()}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Search bar */}
      <div className="mb-6">
        <SearchBar
          compact
          initialValues={{
            tipo_negocio: params.tipo_negocio ?? undefined,
            provincia: params.provincia,
          }}
        />
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className={`shrink-0 ${showFilters ? "block" : "hidden"} w-64 md:block`}>
          <div className="card p-5 space-y-5 sticky top-24">
            <h2 className="font-display text-base font-bold text-primary-900">Filtros</h2>

            {/* Tipo negócio */}
            <div>
              <label className="label">Tipo</label>
              <div className="flex gap-2">
                {["","arrendamento","venda"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setParam("tipo_negocio", t)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                      (params.tipo_negocio ?? "") === t
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-surface-border text-primary-600 hover:bg-primary-50"
                    }`}
                  >
                    {t === "" ? "Todos" : t === "arrendamento" ? "Arrendar" : "Comprar"}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo imóvel */}
            <div>
              <label className="label">Tipo de imóvel</label>
              <select
                value={params.tipo_imovel ?? ""}
                onChange={(e) => setParam("tipo_imovel", e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                {TIPO_IMOVEL_OPTIONS.map((t) => (
                  <option key={t} value={t}>{tipoImovelLabel(t)}</option>
                ))}
              </select>
            </div>

            {/* Província */}
            <div>
              <label className="label">Província</label>
              <select
                value={params.provincia}
                onChange={(e) => setParam("provincia", e.target.value)}
                className="input"
              >
                <option value="">Todas</option>
                {provincias().map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Preço máximo */}
            <div>
              <label className="label">Preço máximo (Kz)</label>
              <input
                type="number"
                placeholder="Ex: 150000"
                defaultValue={params.preco_max ?? ""}
                onBlur={(e) => setParam("preco_max", e.target.value)}
                className="input"
              />
            </div>

            {/* Quartos mínimos */}
            <div>
              <label className="label">Quartos (mín.)</label>
              <div className="flex gap-1.5">
                {[0,1,2,3,4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setParam("quartos_min", n > 0 ? String(n) : "")}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                      (params.quartos_min ?? 0) === n
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-surface-border text-primary-600 hover:bg-primary-50"
                    }`}
                  >
                    {n === 0 ? "T." : n === 4 ? "4+" : n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-primary-500">
              {loading ? "A carregar..." : `${total} imóve${total === 1 ? "l" : "is"} encontrado${total === 1 ? "" : "s"}`}
            </p>
            <button
              className="flex items-center gap-1.5 rounded-xl border border-surface-border px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-surface-muted md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-surface-muted animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-5xl">🏠</div>
              <h3 className="font-display text-lg font-bold text-primary-900">
                Nenhum imóvel encontrado
              </h3>
              <p className="mt-1 text-sm text-primary-500">
                Tenta ajustar os filtros de pesquisa.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl border border-surface-border p-2 text-primary-700 hover:bg-surface-muted disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-primary-600">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-xl border border-surface-border p-2 text-primary-700 hover:bg-surface-muted disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
