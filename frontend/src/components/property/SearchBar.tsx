"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { provincias, tipoNegocioLabel } from "@/lib/utils";
import { TipoNegocio } from "@/types";

interface Props {
  compact?: boolean;
  initialValues?: {
    tipo_negocio?: TipoNegocio;
    provincia?: string;
    q?: string;
  };
}

export function SearchBar({ compact = false, initialValues = {} }: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoNegocio | "">(
    initialValues.tipo_negocio ?? ""
  );
  const [provincia, setProvincia] = useState(initialValues.provincia ?? "");
  const [q, setQ] = useState(initialValues.q ?? "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tipo) params.set("tipo_negocio", tipo);
    if (provincia) params.set("provincia", provincia);
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
      className="rounded-2xl bg-white p-2 shadow-card-hover"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Tipo negócio */}
        <div className="flex overflow-hidden rounded-xl border border-surface-border sm:min-w-[160px]">
          {(["", "arrendamento", "venda"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tipo === t
                  ? "bg-primary-600 text-white"
                  : "text-primary-600 hover:bg-primary-50"
              }`}
            >
              {t === "" ? "Tudo" : tipoNegocioLabel(t)}
            </button>
          ))}
        </div>

        {/* Província */}
        <select
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
          className="input flex-1"
        >
          <option value="">Todas as províncias</option>
          {provincias().map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Keyword */}
        <div className="relative flex-[2]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
          <input
            type="text"
            placeholder="Bairro, município, título..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9"
          />
        </div>

        <button type="submit" className="btn-primary shrink-0 px-6">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Pesquisar</span>
        </button>
      </div>
    </form>
  );
}
