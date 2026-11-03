"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PropertyCard } from "@/components/property/PropertyCard";
import { SearchBar } from "@/components/property/SearchBar";
import { SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import { propertyApi } from "@/lib/api";
import { PropertyListItem, TipoNegocio, TipoImovel } from "@/types";
import {
  tipoImovelLabel,
  provincias,
  municipiosByProvincia,
  comunasByMunicipio,
  bairrosByMunicipio,
} from "@/lib/utils";

const TIPO_IMOVEL_OPTIONS: TipoImovel[] = [
  "apartamento","casa","terreno","loja","escritorio","armazem","quarto","outro",
];

export default function ImoveisContent() {
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
    comuna: sp.get("comuna") ?? "",
    bairro: sp.get("bairro") ?? "",
    preco_max: sp.get("preco_max") ? Number(sp.get("preco_max")) : undefined,
    quartos_min: sp.get("quartos_min") ? Number(sp.get("quartos_min")) : undefined,
    page,
    limit,
  };

  const municipios = params.provincia ? municipiosByProvincia(params.provincia) : [];
  const comunas = params.municipio ? comunasByMunicipio(params.provincia, params.municipio) : [];
  const bairros = params.municipio ? bairrosByMunicipio(params.municipio) : [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== "" && v !== undefined)
      );
      const { data } = await propertyApi.search(clean);
      // backend returns list directly (not paginated {items,total})
      const list = Array.isArray(data) ? data : (data.items ?? []);
      setItems(list);
      setTotal(Array.isArray(data) ? data.length : (data.total ?? 0));
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
    // resetar os níveis abaixo na hierarquia
    if (key === "provincia") { p.delete("municipio"); p.delete("comuna"); p.delete("bairro"); }
    if (key === "municipio") { p.delete("comuna"); p.delete("bairro"); }
    if (key === "comuna") { p.delete("bairro"); }
    p.delete("page");
    router.push(`/imoveis?${p.toString()}`);
  };

  const setPage = (n: number) => {
    const p = new URLSearchParams(sp.toString());
    p.set("page", String(n));
    router.push(`/imoveis?${p.toString()}`);
  };

  const totalPages = Math.ceil(total / limit);

  // Filtros activos para chips de resumo
  const activeFilters = [
    params.tipo_negocio && { key: "tipo_negocio", label: params.tipo_negocio === "arrendamento" ? "Arrendar" : "Comprar" },
    params.tipo_imovel && { key: "tipo_imovel", label: tipoImovelLabel(params.tipo_imovel) },
    params.provincia && { key: "provincia", label: params.provincia },
    params.municipio && { key: "municipio", label: params.municipio },
    params.comuna && { key: "comuna", label: params.comuna },
    params.bairro && { key: "bairro", label: params.bairro },
    params.preco_max && { key: "preco_max", label: `Até ${params.preco_max.toLocaleString()} Kz` },
    params.quartos_min && { key: "quartos_min", label: `${params.quartos_min}+ quartos` },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-dark-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Search bar compacta */}
        <div className="mb-5">
          <SearchBar
            compact
            initialValues={{
              tipo_negocio: params.tipo_negocio ?? undefined,
              provincia: params.provincia,
              municipio: params.municipio,
            }}
          />
        </div>

        {/* Chips de filtros activos */}
        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setParam(f.key, "")}
                className="flex items-center gap-1.5 rounded-full border border-primary-200 dark:border-dark-border bg-white dark:bg-dark-elevated px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 shadow-sm hover:bg-primary-50 dark:hover:bg-dark-card"
              >
                {f.label}
                <X className="h-3 w-3 text-primary-400" />
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar de filtros */}
          <aside
            className={`shrink-0 transition-all duration-200 ${
              showFilters ? "block" : "hidden"
            } w-64 md:block`}
          >
            <div className="sticky top-24 overflow-hidden rounded-2xl bg-white shadow-card dark:bg-dark-card dark:border dark:border-dark-border">
              <div className="border-b border-surface-border dark:border-dark-border px-5 py-4">
                <h2 className="font-display text-sm font-bold text-primary-900 dark:text-slate-100">Filtros</h2>
              </div>

              <div className="space-y-5 p-5">
                {/* Tipo negócio */}
                <div>
                  <label className="label">Tipo</label>
                  <div className="flex gap-1.5">
                    {["","arrendamento","venda"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setParam("tipo_negocio", t)}
                        className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                          (params.tipo_negocio ?? "") === t
                            ? "border-primary-600 bg-primary-600 text-white"
                            : "border-surface-border dark:border-dark-border text-primary-600 dark:text-primary-400 hover:bg-surface-muted dark:hover:bg-dark-elevated"
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

                {/* Localização — hierarquia completa */}
                <div>
                  <label className="label">Localização</label>
                  <div className="space-y-2">
                    {/* Província */}
                    <select
                      value={params.provincia}
                      onChange={(e) => setParam("provincia", e.target.value)}
                      className="input"
                    >
                      <option value="">Província</option>
                      {provincias().map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>

                    {/* Município */}
                    <select
                      value={params.municipio}
                      onChange={(e) => setParam("municipio", e.target.value)}
                      className="input"
                      disabled={!params.provincia}
                    >
                      <option value="">{params.provincia ? "Município" : "— Provincia —"}</option>
                      {municipios.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    {/* Comuna */}
                    <select
                      value={params.comuna}
                      onChange={(e) => setParam("comuna", e.target.value)}
                      className="input"
                      disabled={!params.municipio || comunas.length === 0}
                    >
                      <option value="">{params.municipio ? "Comuna" : "— Município —"}</option>
                      {comunas.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Bairro */}
                    <select
                      value={params.bairro}
                      onChange={(e) => setParam("bairro", e.target.value)}
                      className="input"
                      disabled={!params.municipio || bairros.length === 0}
                    >
                      <option value="">{params.municipio ? "Bairro" : "— Município —"}</option>
                      {bairros.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preço máximo */}
                <div>
                  <label className="label">Preço máximo (Kz)</label>
                  <input
                    type="number"
                    placeholder="Ex: 150 000"
                    defaultValue={params.preco_max ?? ""}
                    onBlur={(e) => setParam("preco_max", e.target.value)}
                    className="input"
                  />
                </div>

                {/* Quartos mínimos */}
                <div>
                  <label className="label">Quartos (mín.)</label>
                  <div className="flex gap-1">
                    {[0,1,2,3,4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setParam("quartos_min", n > 0 ? String(n) : "")}
                        className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                          (params.quartos_min ?? 0) === n
                            ? "border-primary-600 bg-primary-600 text-white"
                            : "border-surface-border dark:border-dark-border text-primary-600 dark:text-primary-400 hover:bg-surface-muted dark:hover:bg-dark-elevated"
                        }`}
                      >
                        {n === 0 ? "T." : n === 4 ? "4+" : n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Resultados */}
          <div className="flex-1 min-w-0">
            {/* Header de resultados */}
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-medium text-primary-600 dark:text-slate-400">
                {loading
                  ? "A carregar..."
                  : `${total} imóve${total === 1 ? "l" : "is"} encontrado${total === 1 ? "" : "s"}`}
              </p>
              <button
                className="flex items-center gap-1.5 rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-card px-3 py-1.5 text-sm font-medium text-primary-700 dark:text-slate-200 shadow-sm hover:bg-surface-muted dark:hover:bg-dark-elevated md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFilters.length > 0 && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {activeFilters.length}
                  </span>
                )}
              </button>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-2xl bg-white dark:bg-dark-card shadow-card animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-dark-card py-20 text-center shadow-card">
                <div className="mb-4 text-5xl">🏠</div>
                <h3 className="font-display text-lg font-bold text-primary-900 dark:text-slate-100">
                  Nenhum imóvel encontrado
                </h3>
                <p className="mt-1 text-sm text-primary-500 dark:text-slate-400">
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

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-card p-2 text-primary-700 dark:text-slate-200 shadow-sm hover:bg-surface-muted dark:hover:bg-dark-elevated disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="rounded-lg border border-surface-border dark:border-dark-border bg-white dark:bg-dark-card px-4 py-2 text-sm font-medium text-primary-700 dark:text-slate-200 shadow-sm">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-card p-2 text-primary-700 dark:text-slate-200 shadow-sm hover:bg-surface-muted dark:hover:bg-dark-elevated disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
