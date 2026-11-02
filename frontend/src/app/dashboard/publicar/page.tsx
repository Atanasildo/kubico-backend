"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { propertyApi, uploadApi } from "@/lib/api";
import { provincias, tipoImovelLabel } from "@/lib/utils";
import { TipoNegocio, TipoImovel } from "@/types";
import { Upload, X, CheckCircle2 } from "lucide-react";

const TIPO_IMOVEL_OPTIONS: TipoImovel[] = [
  "apartamento","casa","terreno","loja","escritorio","armazem","quarto","outro",
];

export default function PublicarPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo_negocio: "arrendamento" as TipoNegocio,
    tipo_imovel: "apartamento" as TipoImovel,
    preco: "",
    moeda: "AOA",
    provincia: "Luanda",
    municipio: "",
    bairro: "",
    endereco_referencia: "",
    area_m2: "",
    quartos: "",
    casas_banho: "",
    mobilado: "",
    tem_garagem: false,
    tem_quintal: false,
    contacto_telefone: "",
    contacto_whatsapp: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      try {
        const { data } = await uploadApi.image(file);
        urls.push(data.url);
      } catch {}
    }
    setImages((prev) => [...prev, ...urls].slice(0, 20));
    setUploading(false);
  };

  const removeImage = (url: string) =>
    setImages((prev) => prev.filter((u) => u !== url));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload: any = {
        ...form,
        preco: parseFloat(form.preco),
        imagens: images,
      };
      if (form.area_m2) payload.area_m2 = parseFloat(form.area_m2);
      if (form.quartos) payload.quartos = parseInt(form.quartos);
      if (form.casas_banho) payload.casas_banho = parseInt(form.casas_banho);
      if (form.mobilado !== "") payload.mobilado = form.mobilado === "true";
      else delete payload.mobilado;
      ["area_m2","quartos","casas_banho","mobilado"].forEach(k => {
        if (payload[k] === "" || payload[k] === null) delete payload[k];
      });

      const { data } = await propertyApi.create(payload);
      setSuccess(true);
      setTimeout(() => router.push(`/imoveis/${data.id}`), 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Erro ao publicar. Verifica os campos.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="font-display text-xl font-bold text-primary-900">Anúncio publicado!</h2>
          <p className="mt-1 text-sm text-primary-500">A redirecionar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-primary-950">
        Publicar anúncio
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo */}
        <div className="card p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-primary-900">Tipo de anúncio</h2>
          <div>
            <label className="label">Negócio</label>
            <div className="flex gap-2">
              {(["arrendamento","venda"] as TipoNegocio[]).map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, tipo_negocio: t }))}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                    form.tipo_negocio === t
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-surface-border text-primary-700 hover:bg-primary-50"
                  }`}
                >
                  {t === "arrendamento" ? "Arrendamento" : "Venda"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Tipo de imóvel</label>
            <select value={form.tipo_imovel} onChange={set("tipo_imovel")} className="input">
              {TIPO_IMOVEL_OPTIONS.map(t => <option key={t} value={t}>{tipoImovelLabel(t)}</option>)}
            </select>
          </div>
        </div>

        {/* Basic info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-primary-900">Informações</h2>
          <div>
            <label className="label">Título do anúncio *</label>
            <input value={form.titulo} onChange={set("titulo")} placeholder="Ex: Apartamento T3 no Talatona" required minLength={5} maxLength={150} className="input" />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea value={form.descricao} onChange={set("descricao")} placeholder="Descreve o imóvel em detalhe..." rows={4} maxLength={3000} className="input resize-none" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Preço *</label>
              <input type="number" value={form.preco} onChange={set("preco")} placeholder="Ex: 150000" required min="0" className="input" />
            </div>
            <div>
              <label className="label">Moeda</label>
              <select value={form.moeda} onChange={set("moeda")} className="input">
                <option value="AOA">AOA (Kz)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-primary-900">Localização</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Província *</label>
              <select value={form.provincia} onChange={set("provincia")} className="input">
                {provincias().map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Município *</label>
              <input value={form.municipio} onChange={set("municipio")} placeholder="Ex: Talatona" required className="input" />
            </div>
          </div>
          <div>
            <label className="label">Bairro</label>
            <input value={form.bairro} onChange={set("bairro")} placeholder="Ex: Bairro Popular" className="input" />
          </div>
          <div>
            <label className="label">Referência de endereço</label>
            <input value={form.endereco_referencia} onChange={set("endereco_referencia")} placeholder="Ex: Próximo ao Belas Shopping" className="input" />
          </div>
        </div>

        {/* Details */}
        <div className="card p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-primary-900">Detalhes</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Área (m²)</label>
              <input type="number" value={form.area_m2} onChange={set("area_m2")} placeholder="Ex: 120" min="0" className="input" />
            </div>
            <div>
              <label className="label">Quartos</label>
              <input type="number" value={form.quartos} onChange={set("quartos")} placeholder="Ex: 3" min="0" max="50" className="input" />
            </div>
            <div>
              <label className="label">Casas banho</label>
              <input type="number" value={form.casas_banho} onChange={set("casas_banho")} placeholder="Ex: 2" min="0" max="50" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Mobiliado</label>
            <select value={form.mobilado} onChange={set("mobilado")} className="input">
              <option value="">Não indicado</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.tem_garagem} onChange={set("tem_garagem")} className="h-4 w-4 rounded border-surface-border text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-primary-800">Garagem</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.tem_quintal} onChange={set("tem_quintal")} className="h-4 w-4 rounded border-surface-border text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-primary-800">Quintal</span>
            </label>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-primary-900">Contacto</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Telefone</label>
              <input type="tel" value={form.contacto_telefone} onChange={set("contacto_telefone")} placeholder="+244 9XX XXX XXX" className="input" />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input type="tel" value={form.contacto_whatsapp} onChange={set("contacto_whatsapp")} placeholder="+244 9XX XXX XXX" className="input" />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-primary-900">Fotos</h2>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-border bg-surface-muted p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors">
            <Upload className="mb-2 h-8 w-8 text-primary-400" />
            <span className="text-sm font-medium text-primary-700">
              {uploading ? "A fazer upload..." : "Clica para adicionar fotos"}
            </span>
            <span className="mt-1 text-xs text-primary-500">PNG, JPG, WEBP — máx. 20 fotos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} disabled={uploading} />
          </label>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-surface-muted">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeImage(url)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-primary-700 shadow-sm hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting || uploading} className="btn-primary w-full justify-center py-3 text-base">
          {submitting ? "A publicar..." : "Publicar anúncio"}
        </button>
      </form>
    </div>
  );
}
