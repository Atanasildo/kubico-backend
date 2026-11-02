"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { propertyApi, uploadApi } from "@/lib/api";
import { provincias, tipoImovelLabel } from "@/lib/utils";
import { TipoNegocio, TipoImovel } from "@/types";
import {
  ArrowLeft, Upload, X, CheckCircle2, AlertCircle,
  MapPin, Navigation, Loader2,
} from "lucide-react";

const TIPO_IMOVEL_OPTIONS: TipoImovel[] = [
  "apartamento","casa","terreno","loja","escritorio","armazem","quarto","outro",
];

const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,image/avif,image/tiff,.heic,.heif,.avif,.tiff,.tif,.bmp,.gif";

// ── GPS Picker ────────────────────────────────────────────────────────────────
function GpsPicker({
  lat, lng,
  onChange,
}: {
  lat: string; lng: string;
  onChange: (lat: string, lng: string) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // build OSM embed URL from current coords
  const hasCoords = lat !== "" && lng !== "";
  const iframeSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        (parseFloat(lng) - 0.01).toFixed(6)
      },${(parseFloat(lat) - 0.01).toFixed(6)},${
        (parseFloat(lng) + 0.01).toFixed(6)
      },${(parseFloat(lat) + 0.01).toFixed(6)}&layer=mapnik&marker=${lat},${lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=11.7,-9.0,25.0,-4.0&layer=mapnik`;

  const locate = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocalização não suportada neste browser.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(
          pos.coords.latitude.toFixed(6),
          pos.coords.longitude.toFixed(6)
        );
        setLocating(false);
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? "Permissão de localização negada."
            : "Não foi possível obter localização."
        );
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label mb-0">Coordenadas GPS <span className="text-primary-400 dark:text-slate-500 font-normal">(opcional)</span></label>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-lg border border-primary-200 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-dark-elevated transition-colors disabled:opacity-50"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Navigation className="h-3.5 w-3.5" />
          )}
          {locating ? "A localizar..." : "Usar localização actual"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Latitude</label>
          <input
            type="number"
            step="0.000001"
            min="-90"
            max="90"
            value={lat}
            onChange={(e) => onChange(e.target.value, lng)}
            placeholder="Ex: -8.838333"
            className="input"
          />
        </div>
        <div>
          <label className="label">Longitude</label>
          <input
            type="number"
            step="0.000001"
            min="-180"
            max="180"
            value={lng}
            onChange={(e) => onChange(lat, e.target.value)}
            placeholder="Ex: 13.234444"
            className="input"
          />
        </div>
      </div>

      {geoError && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {geoError}
        </p>
      )}

      {hasCoords && (
        <p className="text-xs text-primary-500 dark:text-slate-400">
          📍 {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
        </p>
      )}

      {/* OSM embed preview */}
      <div className="overflow-hidden rounded-xl border border-surface-border dark:border-dark-border">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          width="100%"
          height="200"
          className="block w-full"
          style={{ border: 0 }}
          loading="lazy"
          title="Pré-visualização do mapa"
        />
        <div className="border-t border-surface-border dark:border-dark-border bg-surface-muted dark:bg-dark-surface px-3 py-1.5 text-xs text-primary-500 dark:text-slate-500">
          {hasCoords
            ? "Posição marcada no mapa"
            : "Introduz as coordenadas ou usa a localização actual para ver no mapa"}
        </div>
      </div>

      {hasCoords && (
        <button
          type="button"
          onClick={() => onChange("", "")}
          className="text-xs text-primary-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Remover coordenadas
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
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
  latitude: "",
  longitude: "",
  area_m2: "",
  quartos: "",
  casas_banho: "",
  mobilado: "",
  tem_garagem: false,
  tem_quintal: false,
  contacto_telefone: "",
  contacto_whatsapp: "",
};

export default function PublicarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = Boolean(editId);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);

  // Load existing property when in edit mode
  useEffect(() => {
    if (!editId) return;
    propertyApi.get(editId).then(({ data }) => {
      setForm({
        titulo: data.titulo ?? "",
        descricao: data.descricao ?? "",
        tipo_negocio: data.tipo_negocio ?? "arrendamento",
        tipo_imovel: data.tipo_imovel ?? "apartamento",
        preco: data.preco != null ? String(data.preco) : "",
        moeda: data.moeda ?? "AOA",
        provincia: data.provincia ?? "Luanda",
        municipio: data.municipio ?? "",
        bairro: data.bairro ?? "",
        endereco_referencia: data.endereco_referencia ?? "",
        latitude: data.latitude != null ? String(data.latitude) : "",
        longitude: data.longitude != null ? String(data.longitude) : "",
        area_m2: data.area_m2 != null ? String(data.area_m2) : "",
        quartos: data.quartos != null ? String(data.quartos) : "",
        casas_banho: data.casas_banho != null ? String(data.casas_banho) : "",
        mobilado: data.mobilado != null ? String(data.mobilado) : "",
        tem_garagem: data.tem_garagem ?? false,
        tem_quintal: data.tem_quintal ?? false,
        contacto_telefone: data.contacto_telefone ?? "",
        contacto_whatsapp: data.contacto_whatsapp ?? "",
      });
      setImages(Array.isArray(data.imagens) ? data.imagens : []);
    }).catch(() => {
      setError("Não foi possível carregar o anúncio para edição.");
    }).finally(() => setLoadingEdit(false));
  }, [editId]);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({
        ...f,
        [k]:
          e.target.type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : e.target.value,
      }));

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const ALLOWED_MIME = new Set([
      "image/jpeg","image/jpg","image/png","image/webp",
      "image/gif","image/bmp","image/tiff",
      "image/heic","image/heif","image/avif",
    ]);
    const ALLOWED_EXT = new Set([
      ".jpg",".jpeg",".png",".webp",".gif",".bmp",
      ".heic",".heif",".avif",".tiff",".tif",
    ]);
    const invalid = files.filter((f) => {
      const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
      return !ALLOWED_MIME.has(f.type) && !ALLOWED_EXT.has(ext);
    });
    if (invalid.length) {
      setUploadError(
        `Formato não suportado: ${invalid.map((f) => f.name).join(", ")}.`
      );
      e.target.value = "";
      return;
    }

    setUploadError("");
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      try {
        const { data } = await uploadApi.image(file);
        urls.push(data.url);
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "Falha ao carregar imagem.";
        setUploadError(msg);
      }
    }
    if (urls.length) {
      setImages((prev) => [...prev, ...urls].slice(0, 20));
    }
    setUploading(false);
    e.target.value = "";
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
      if (form.latitude !== "") payload.latitude = parseFloat(form.latitude);
      else delete payload.latitude;
      if (form.longitude !== "") payload.longitude = parseFloat(form.longitude);
      else delete payload.longitude;
      ["area_m2", "quartos", "casas_banho"].forEach((k) => {
        if (payload[k] === "" || payload[k] == null) delete payload[k];
      });

      let resultId: string;
      if (isEdit && editId) {
        const { data } = await propertyApi.update(editId, payload);
        resultId = data.id ?? editId;
      } else {
        const { data } = await propertyApi.create(payload);
        resultId = data.id;
      }
      setSuccess(true);
      setTimeout(() => router.push(`/imoveis/${resultId}`), 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Erro ao publicar. Verifica os campos e tenta novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="font-display text-xl font-bold text-primary-900 dark:text-white">
            {isEdit ? "Anúncio actualizado!" : "Anúncio publicado!"}
          </h2>
          <p className="mt-1 text-sm text-primary-500 dark:text-slate-400">
            A redirecionar...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/anuncios"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-white text-primary-600 shadow-sm hover:bg-surface-muted dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-primary-950 dark:text-white">
          {isEdit ? "Editar anúncio" : "Publicar anúncio"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo */}
        <div className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            Tipo de anúncio
          </h2>
          <div>
            <label className="label">Negócio</label>
            <div className="flex gap-2">
              {(["arrendamento", "venda"] as TipoNegocio[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, tipo_negocio: t }))}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                    form.tipo_negocio === t
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-surface-border text-primary-700 hover:bg-primary-50 dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-elevated"
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
              {TIPO_IMOVEL_OPTIONS.map((t) => (
                <option key={t} value={t}>{tipoImovelLabel(t)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Info */}
        <div className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            Informações
          </h2>
          <div>
            <label className="label">Título *</label>
            <input
              value={form.titulo}
              onChange={set("titulo")}
              placeholder="Ex: Apartamento T3 no Talatona"
              required minLength={5} maxLength={150}
              className="input"
            />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={set("descricao")}
              placeholder="Descreve o imóvel em detalhe..."
              rows={4} maxLength={3000}
              className="input resize-none"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Preço *</label>
              <input
                type="number" value={form.preco} onChange={set("preco")}
                placeholder="Ex: 150000" required min="0" className="input"
              />
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
        <div className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            Localização
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Província *</label>
              <select value={form.provincia} onChange={set("provincia")} className="input">
                {provincias().map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Município *</label>
              <input
                value={form.municipio} onChange={set("municipio")}
                placeholder="Ex: Talatona" required className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Bairro</label>
            <input
              value={form.bairro} onChange={set("bairro")}
              placeholder="Ex: Bairro Popular" className="input"
            />
          </div>
          <div>
            <label className="label">Referência de endereço</label>
            <input
              value={form.endereco_referencia} onChange={set("endereco_referencia")}
              placeholder="Ex: Próximo ao Belas Shopping" className="input"
            />
          </div>

          {/* GPS Picker */}
          <div className="border-t border-surface-border dark:border-dark-border pt-4">
            <GpsPicker
              lat={form.latitude}
              lng={form.longitude}
              onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
            />
          </div>
        </div>

        {/* Details */}
        <div className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            Detalhes
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label">Área (m²)</label>
              <input
                type="number" value={form.area_m2} onChange={set("area_m2")}
                placeholder="Ex: 120" min="0" className="input"
              />
            </div>
            <div>
              <label className="label">Quartos</label>
              <input
                type="number" value={form.quartos} onChange={set("quartos")}
                placeholder="Ex: 3" min="0" max="50" className="input"
              />
            </div>
            <div>
              <label className="label">Casas de banho</label>
              <input
                type="number" value={form.casas_banho} onChange={set("casas_banho")}
                placeholder="Ex: 2" min="0" max="50" className="input"
              />
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
          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox" checked={form.tem_garagem} onChange={set("tem_garagem")}
                className="h-4 w-4 rounded border-surface-border text-primary-600"
              />
              <span className="text-sm text-primary-800 dark:text-slate-300">Garagem</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox" checked={form.tem_quintal} onChange={set("tem_quintal")}
                className="h-4 w-4 rounded border-surface-border text-primary-600"
              />
              <span className="text-sm text-primary-800 dark:text-slate-300">Quintal</span>
            </label>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            Contacto
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Telefone</label>
              <input
                type="tel" value={form.contacto_telefone} onChange={set("contacto_telefone")}
                placeholder="+244 9XX XXX XXX" className="input"
              />
            </div>
            <div>
              <label className="label">WhatsApp</label>
              <input
                type="tel" value={form.contacto_whatsapp} onChange={set("contacto_whatsapp")}
                placeholder="+244 9XX XXX XXX" className="input"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            Fotos
          </h2>
          <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              uploading
                ? "border-primary-300 bg-primary-50 dark:bg-primary-900/10"
                : "border-surface-border bg-surface-muted hover:border-primary-400 hover:bg-primary-50 dark:border-dark-border dark:bg-dark-surface dark:hover:border-primary-500 dark:hover:bg-primary-900/10"
            }`}
          >
            <Upload
              className={`mb-2 h-8 w-8 ${uploading ? "animate-pulse text-primary-500" : "text-primary-400"}`}
            />
            <span className="text-sm font-medium text-primary-700 dark:text-slate-300">
              {uploading ? "A fazer upload..." : "Clica para adicionar fotos"}
            </span>
            <span className="mt-1 text-xs text-primary-500 dark:text-slate-500">
              JPEG, PNG, WebP, GIF, BMP, HEIC, AVIF, TIFF · máx. 20 fotos · 50 MB cada
            </span>
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              multiple
              className="hidden"
              onChange={handleImages}
              disabled={uploading}
            />
          </label>

          {uploadError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {uploadError}
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((url) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-xl bg-surface-muted dark:bg-dark-surface"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 dark:bg-dark-card/90 text-primary-700 dark:text-slate-300 shadow-sm hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploading}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {isEdit ? "A guardar..." : "A publicar..."}
            </>
          ) : (
            isEdit ? "Guardar alterações" : "Publicar anúncio"
          )}
        </button>
      </form>
    </div>
  );
}
