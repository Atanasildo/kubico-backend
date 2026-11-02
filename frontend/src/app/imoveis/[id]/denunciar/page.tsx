"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CheckCircle2, ArrowLeft } from "lucide-react";

const MOTIVOS = [
  { value: "anuncio_falso", label: "Anúncio falso" },
  { value: "preco_enganoso", label: "Preço enganoso" },
  { value: "ja_arrendado_vendido", label: "Já arrendado/vendido" },
  { value: "fotos_falsas", label: "Fotos falsas" },
  { value: "comportamento_abusivo", label: "Comportamento abusivo" },
  { value: "spam", label: "Spam" },
  { value: "outro", label: "Outro" },
];

export default function DenunciarPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post(`/properties/${id}/report`, { motivo, descricao: descricao || undefined });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Erro ao enviar denúncia.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="font-display text-xl font-bold text-primary-900">Denúncia enviada</h2>
          <p className="mt-1 text-sm text-primary-500">A nossa equipa irá analisar brevemente.</p>
          <button onClick={() => router.back()} className="btn-secondary mt-5">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <button onClick={() => router.back()} className="mb-5 flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>
      <h1 className="mb-6 font-display text-2xl font-bold text-primary-950">Denunciar anúncio</h1>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Motivo *</label>
            <select value={motivo} onChange={e => setMotivo(e.target.value)} required className="input">
              <option value="">Seleccionar motivo</option>
              {MOTIVOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Descrição (opcional)</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} maxLength={1000} className="input resize-none" placeholder="Dá mais detalhes sobre a ocorrência..." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading || !motivo} className="btn-primary w-full justify-center">
            {loading ? "A enviar..." : "Enviar denúncia"}
          </button>
        </form>
      </div>
    </div>
  );
}
