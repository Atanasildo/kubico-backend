"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import {
  provincias,
  municipiosByProvincia,
  comunasByMunicipio,
  bairrosByMunicipio,
  tipoNegocioLabel,
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

export function SearchBar({ compact = false, initialValues = {} }: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoNegocio | "">(initialValues.tipo_negocio ?? "");
  const [provincia, setProvincia] = useState(initialValues.provincia ?? "");
  const [municipio, setMunicipio] = useState(initialValues.municipio ?? "");
  const [comuna, setComuna] = useState(initialValues.comuna ?? "");
  const [bairro, setBairro] = useState(initialValues.bairro ?? "");
  const [q, setQ] = useState(initialValues.q ?? "");

  // Resetar cascata quando nível superior muda
  useEffect(() => { setMunicipio(""); setComuna(""); setBairro(""); }, [provincia]);
  useEffect(() => { setComuna(""); setBairro(""); }, [municipio]);
  useEffect(() => { setBairro(""); }, [comuna]);

  const municipios = provincia ? municipiosByProvincia(provincia) : [];
  const comunas = municipio ? comunasByMunicipio(provincia, municipio) : [];
  const bairros = municipio ? bairrosByMunicipio(municipio) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tipo) params.set("tipo_negocio", tipo);
    if (provincia) params.set("provincia", provincia);
    if (municipio) params.set("municipio", municipio);
    if (comuna) params.set("comuna", comuna);
    if (bairro) params.set("bairro", bairro);
    if (q) params.set("q", q);
    router.push(`/imoveis?${params.toString()}`);
  };

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

  return (
    <form
      onSubmit={handleSearch}
      className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(19,28,87,0.18)]"
    >
      {/* Tipo negócio — tab row */}
      <div className="flex border-b border-surface-border">
        {(["", "arrendamento", "venda"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-colors ${
              tipo === t
                ? "bg-primary-600 text-white"
                : "text-primary-500 hover:bg-surface-muted hover:text-primary-800"
            }`}
          >
            {t === "" ? "Tudo" : t === "arrendamento" ? "Arrendar" : "Comprar"}
          </button>
        ))}
      </div>

      {/* Campos principais */}
      <div className="p-3">
        {/* Linha 1: Província + Município */}
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
            <select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="input pl-9 appearance-none"
            >
              <option value="">Província</option>
              {provincias().map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="input"
            disabled={!provincia}
          >
            <option value="">{provincia ? "Município" : "— Escolhe a província —"}</option>
            {municipios.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Linha 2: Comuna + Bairro */}
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            className="input"
            disabled={!municipio || comunas.length === 0}
          >
            <option value="">{municipio ? "Comuna" : "— Escolhe o município —"}</option>
            {comunas.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            className="input"
            disabled={!municipio || bairros.length === 0}
          >
            <option value="">{municipio ? "Bairro" : "— Escolhe o município —"}</option>
            {bairros.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Linha 3: Keyword + Botão */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
            <input
              type="text"
              placeholder="Título, referência, zona..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 px-6 py-2.5">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Pesquisar</span>
          </button>
        </div>
      </div>
    </form>
  );
}
