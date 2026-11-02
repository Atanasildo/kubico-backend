"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown } from "lucide-react";
import {
  provincias,
  municipiosByProvincia,
  comunasByMunicipio,
  bairrosByMunicipio,
} from "@/lib/utils";
import { TipoNegocio } from "@/types";

interface Props {
  compact?: boolean;
  initialValues?: {
    tipo_negocio?: TipoNegocio;
    provincia?: string;
    municipio?: string;
    comuna?: string;
    bairro?: string;
    q?: string;
  };
}

// Shared select style for the hero dark background
const GLASS_SELECT =
  "w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-4 py-3 pr-9 text-sm text-white placeholder-white/50 backdrop-blur-sm transition-colors hover:bg-white/15 focus:border-terra-400 focus:bg-white/15 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

const GLASS_INPUT =
  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 pl-10 text-sm text-white placeholder-white/50 backdrop-blur-sm transition-colors hover:bg-white/15 focus:border-terra-400 focus:bg-white/15 focus:outline-none";

export function SearchBar({ compact = false, initialValues = {} }: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoNegocio | "">(initialValues.tipo_negocio ?? "");
  const [provincia, setProvincia] = useState(initialValues.provincia ?? "");
  const [municipio, setMunicipio] = useState(initialValues.municipio ?? "");
  const [comuna, setComuna] = useState(initialValues.comuna ?? "");
  const [bairro, setBairro] = useState(initialValues.bairro ?? "");
  const [q, setQ] = useState(initialValues.q ?? "");

  useEffect(() => { setMunicipio(""); setComuna(""); setBairro(""); }, [provincia]);
  useEffect(() => { setComuna(""); setBairro(""); }, [municipio]);
  useEffect(() => { setBairro(""); }, [comuna]);

  const municipios = provincia ? municipiosByProvincia(provincia) : [];
  const comunas    = municipio ? comunasByMunicipio(provincia, municipio) : [];
  const bairros    = municipio ? bairrosByMunicipio(municipio) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tipo)      params.set("tipo_negocio", tipo);
    if (provincia) params.set("provincia", provincia);
    if (municipio) params.set("municipio", municipio);
    if (comuna)    params.set("comuna", comuna);
    if (bairro)    params.set("bairro", bairro);
    if (q)         params.set("q", q);
    router.push(`/imoveis?${params.toString()}`);
  };

  // ── Compact variant (used inside /imoveis page) ───────────────────────────
  if (compact) {
    return (
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
          <input
            type="text"
            placeholder="Pesquisar imóveis..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn-primary px-4 py-2.5">
          <Search className="h-4 w-4" />
        </button>
      </form>
    );
  }

  // ── Hero variant ──────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSearch}
      className="overflow-hidden rounded-2xl bg-white/8 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-md border border-white/10"
    >
      {/* Tipo negócio — tab row */}
      <div className="flex border-b border-white/10">
        {(["", "arrendamento", "venda"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`flex-1 py-3.5 text-sm font-semibold tracking-wide transition-all ${
              tipo === t
                ? "bg-primary-600 text-white shadow-inner"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t === "" ? "Tudo" : t === "arrendamento" ? "Arrendar" : "Comprar"}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {/* Row 1: Província + Município */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Província */}
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-terra-400" />
            <select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className={`${GLASS_SELECT} pl-9`}
            >
              <option value="" className="bg-primary-900 text-white">Todas as províncias</option>
              {provincias().map((p) => (
                <option key={p} value={p} className="bg-primary-900 text-white">{p}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          </div>

          {/* Município — desactivado até província estar escolhida */}
          <div className="relative">
            <select
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              disabled={!provincia}
              className={GLASS_SELECT}
            >
              <option value="" className="bg-primary-900 text-white">
                {provincia ? "Todos os municípios" : "Escolhe a província primeiro"}
              </option>
              {municipios.map((m) => (
                <option key={m} value={m} className="bg-primary-900 text-white">{m}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          </div>
        </div>

        {/* Row 2: Comuna + Bairro — só aparece quando há município */}
        {municipio && (comunas.length > 0 || bairros.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {comunas.length > 0 && (
              <div className="relative">
                <select
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  className={GLASS_SELECT}
                >
                  <option value="" className="bg-primary-900 text-white">Todas as comunas</option>
                  {comunas.map((c) => (
                    <option key={c} value={c} className="bg-primary-900 text-white">{c}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              </div>
            )}
            {bairros.length > 0 && (
              <div className="relative">
                <select
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className={GLASS_SELECT}
                >
                  <option value="" className="bg-primary-900 text-white">Todos os bairros</option>
                  {bairros.map((b) => (
                    <option key={b} value={b} className="bg-primary-900 text-white">{b}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              </div>
            )}
          </div>
        )}

        {/* Row 3: Keyword + Botão */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Título, referência, zona..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={GLASS_INPUT}
            />
          </div>
          <button
            type="submit"
            className="shrink-0 flex items-center gap-2 rounded-xl bg-terra-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-terra-900/40 transition-all hover:bg-terra-400 active:scale-95"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Pesquisar</span>
          </button>
        </div>
      </div>
    </form>
  );
}
