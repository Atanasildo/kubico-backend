"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { propertyApi, uploadApi } from "@/lib/api";
import { provincias, tipoImovelLabel } from "@/lib/utils";
import { TipoNegocio, TipoImovel } from "@/types";
import {
  ArrowLeft, Upload, X, CheckCircle2, AlertCircle,
  Navigation, Loader2,
} from "lucide-react";

const TIPO_IMOVEL_OPTIONS: TipoImovel[] = [
  "apartamento","casa","terreno","loja","escritorio","armazem","quarto","outro",
];

const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,image/avif,image/tiff,.heic,.heif,.avif,.tiff,.tif,.bmp,.gif";

// ── Contadores, Utilities, Acabamentos ───────────────────────────────────────
const CONTADORES = [
  { key: "quartos",       label: "Quartos",        icon: "🛏️" },
  { key: "casas_banho",   label: "Casas de banho", icon: "🚿" },
  { key: "cozinhas",      label: "Cozinhas",       icon: "🍳" },
  { key: "salas",         label: "Salas",          icon: "🛋️" },
  { key: "varandas",      label: "Varandas",       icon: "🌿" },
  { key: "despensas",     label: "Despensas",      icon: "📦" },
  { key: "garagens",      label: "Garagens",       icon: "🚗" },
] as const;

const UTILITIES = [
  { key: "tem_energia",        label: "Energia eléctrica" },
  { key: "tem_agua",           label: "Água canalizada"   },
  { key: "tem_gerador",        label: "Gerador"           },
  { key: "tem_fossa_septica",  label: "Fossa séptica"     },
] as const;

const ACABAMENTOS = [
  { key: "mobilado",      label: "Mobilado"      },
  { key: "tem_wc_servico",label: "WC de serviço" },
  { key: "tem_seguranca", label: "Segurança 24h" },
  { key: "tem_piscina",   label: "Piscina"       },
  { key: "tem_elevador",  label: "Elevador"      },
  { key: "tem_quintal",   label: "Quintal"       },
] as const;

type PisoTipo = "mosaico" | "cimento" | "madeira" | "outro";

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
        <label className="label mb-0">
          Coordenadas GPS{" "}
          <span className="text-primary-400 dark:text-slate-500 font-normal">(opcional)</span>
        </label>
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
            type="number" step="0.000001" min="-90" max="90"
            value={lat} onChange={(e) => onChange(e.target.value, lng)}
            placeholder="Ex: -8.838333" className="input"
          />
        </div>
        <div>
          <label className="label">Longitude</label>
          <input
            type="number" step="0.000001" min="-180" max="180"
            value={lng} onChange={(e) => onChange(lat, e.target.value)}
            placeholder="Ex: 13.234444" className="input"
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

      <div className="overflow-hidden rounded-xl border border-surface-border dark:border-dark-border">
        <iframe
          ref={iframeRef} src={iframeSrc} width="100%" height="200"
          className="block w-full" style={{ border: 0 }} loading="lazy"
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
          type="button" onClick={() => onChange("", "")}
          className="text-xs text-primary-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Remover coordenadas
        </button>
      )}
    </div>
  );
}

// ── Contador stepper ──────────────────────────────────────────────────────────
function Stepper({ label, icon, value, onChange }: {
  label: string; icon: string; value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2.5">
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-sm text-primary-800 dark:text-slate-200">{label}</span>
      <div className="flex items-center gap-1">
        <button type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-6 h-6 rounded-full bg-surface-muted dark:bg-dark-muted text-primary-700 dark:text-slate-300 flex items-center justify-center hover:bg-primary-100 dark:hover:bg-dark-elevated transition-colors text-sm font-bold"
        >−</button>
        <span className="w-6 text-center text-sm font-semibold text-primary-900 dark:text-white">{value}</span>
        <button type="button"
          onClick={() => onChange(value + 1)}
          className="w-6 h-6 rounded-full bg-surface-muted dark:bg-dark-muted text-primary-700 dark:text-slate-300 flex items-center justify-center hover:bg-primary-100 dark:hover:bg-dark-elevated transition-colors text-sm font-bold"
        >+</button>
      </div>
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────────
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
  andares: "",
  // Contadores
  quartos:     0,
  casas_banho: 0,
  cozinhas:    0,
  salas:       0,
  varandas:    0,
  despensas:   0,
  garagens:    0,
  // Utilities
  tem_energia:       false,
  tem_agua:          false,
  tem_gerador:       false,
  tem_fossa_septica: false,
  // Acabamentos
  piso_tipo:     "outro" as PisoTipo,
  mobilado:      false,
  tem_wc_servico:false,
  tem_piscina:   false,
  tem_seguranca: false,
  tem_elevador:  false,
  tem_quintal:   false,
  // Contacto
  contacto_telefone: "",
  contacto_whatsapp: "",
};

// ── Inner component ───────────────────────────────────────────────────────────
function PublicarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = Boolean(editId);

  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);

  useEffect(() => {
    if (!editId) return;
    propertyApi.get(editId).then(({ data }) => {
      setForm({
        titulo:               data.titulo ?? "",
        descricao:            data.descricao ?? "",
        tipo_negocio:         data.tipo_negocio ?? "arrendamento",
        tipo_imovel:          data.tipo_imovel ?? "apartamento",
        preco:                data.preco != null ? String(data.preco) : "",
        moeda:                data.moeda ?? "AOA",
        provincia:            data.provincia ?? "Luanda",
        municipio:            data.municipio ?? "",
        bairro:               data.bairro ?? "",
        endereco_referencia:  data.endereco_referencia ?? "",
        latitude:             data.latitude != null ? String(data.latitude) : "",
        longitude:            data.longitude != null ? String(data.longitude) : "",
        area_m2:              data.area_m2 != null ? String(data.area_m2) : "",
        andares:              data.andares != null ? String(data.andares) : "",
        quartos:              data.quartos ?? 0,
        casas_banho:          data.casas_banho ?? 0,
        cozinhas:             data.cozinhas ?? 0,
        salas:                data.salas ?? 0,
        varandas:             data.varandas ?? 0,
        despensas:            data.despensas ?? 0,
        garagens:             data.garagens ?? 0,
        tem_energia:          data.tem_energia ?? false,
        tem_agua:             data.tem_agua ?? false,
        tem_gerador:          data.tem_gerador ?? false,
        tem_fossa_septica:    data.tem_fossa_septica ?? false,
        piso_tipo:            (data.piso_tipo as PisoTipo) ?? "outro",
        mobilado:             data.mobilado ?? false,
        tem_wc_servico:       data.tem_wc_servico ?? false,
        tem_piscina:          data.tem_piscina ?? false,
        tem_seguranca:        data.tem_seguranca ?? false,
        tem_elevador:         data.tem_elevador ?? false,
        tem_quintal:          data.tem_quintal ?? false,
        contacto_telefone:    data.contacto_telefone ?? "",
        contacto_whatsapp:    data.contacto_whatsapp ?? "",
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
        [k]: e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value,
      }));

  const setNum = (k: string) => (v: number) =>
    setForm((f) => ({ ...f, [k]: v }));

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
      setUploadError(`Formato não suportado: ${invalid.map((f) => f.name).join(", ")}.`);
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
        const msg = err?.response?.data?.detail || err?.message || "Falha ao carregar imagem.";
        setUploadError(msg);
      }
    }
    if (urls.length) setImages((prev) => [...prev, ...urls].slice(0, 20));
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url));

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
      if (form.area_m2)  payload.area_m2  = parseFloat(form.area_m2);
      else delete payload.area_m2;
      if (form.andares)  payload.andares  = parseInt(form.andares);
      else delete payload.andares;
      if (form.latitude  !== "") payload.latitude  = parseFloat(form.latitude);
      else delete payload.latitude;
      if (form.longitude !== "") payload.longitude = parseFloat(form.longitude);
      else delete payload.longitude;

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

  if (authLoading || loadingEdit) {
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
          <p className="mt-1 text-sm text-primary-500 dark:text-slate-400">A redirecionar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
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
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">Tipo de anúncio</h2>
          <div>
            <label className="label">Negócio</label>
            <div className="flex gap-2">
              {(["arrendamento","venda"] as TipoNegocio[]).map((t) => (
                <button key={t} type="button"
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

        {/* Informações */}
        <div className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">Informações</h2>
          <div>
            <label className="label">Título *</label>
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

        {/* Localização */}
        <div className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">Localização</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Província *</label>
              <select value={form.provincia} onChange={set("provincia")} className="input">
                {provincias().map((p) => <option key={p} value={p}>{p}</option>)}
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
          <div className="border-t border-surface-border dark:border-dark-border pt-4">
            <GpsPicker
              lat={form.latitude} lng={form.longitude}
              onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
            />
          </div>
        </div>

        {/* Detalhes */}
        <div className="card p-5 space-y-5 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">Detalhes</h2>

          {/* Dimensões */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Área (m²)</label>
              <input type="number" value={form.area_m2} onChange={set("area_m2")} placeholder="Ex: 120" min="0" className="input" />
            </div>
            <div>
              <label className="label">Andar</label>
              <input type="number" value={form.andares} onChange={set("andares")} placeholder="Ex: 3" min="0" max="200" className="input" />
            </div>
          </div>

          {/* Divisões — steppers */}
          <div>
            <p className="label mb-2">Divisões</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CONTADORES.map(({ key, label, icon }) => (
                <Stepper
                  key={key} label={label} icon={icon}
                  value={(form as any)[key] as number}
                  onChange={setNum(key)}
                />
              ))}
            </div>
          </div>

          {/* Piso */}
          <div>
            <p className="label mb-2">Tipo de piso</p>
            <div className="flex flex-wrap gap-2">
              {(["mosaico","cimento","madeira","outro"] as PisoTipo[]).map((tipo) => (
                <button key={tipo} type="button"
                  onClick={() => setForm((f) => ({ ...f, piso_tipo: tipo }))}
                  className={`px-4 py-2 rounded-full border text-sm capitalize transition-colors ${
                    form.piso_tipo === tipo
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-surface-border dark:border-dark-border text-primary-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-dark-elevated"
                  }`}
                >{tipo}</button>
              ))}
            </div>
          </div>

          {/* Utilities */}
          <div>
            <p className="label mb-2">Utilidades</p>
            <div className="grid grid-cols-2 gap-2">
              {UTILITIES.map(({ key, label }) => (
                <label key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2.5 hover:bg-surface-muted dark:hover:bg-dark-elevated transition-colors"
                >
                  <input type="checkbox"
                    checked={!!(form as any)[key]}
                    onChange={set(key)}
                    className="h-4 w-4 rounded border-surface-border text-primary-600"
                  />
                  <span className="text-sm text-primary-800 dark:text-slate-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Acabamentos */}
          <div>
            <p className="label mb-2">Comodidades</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ACABAMENTOS.map(({ key, label }) => (
                <label key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2.5 hover:bg-surface-muted dark:hover:bg-dark-elevated transition-colors"
                >
                  <input type="checkbox"
                    checked={!!(form as any)[key]}
                    onChange={set(key)}
                    className="h-4 w-4 rounded border-surface-border text-primary-600"
                  />
                  <span className="text-sm text-primary-800 dark:text-slate-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">Contacto</h2>
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

        {/* Fotos */}
        <div className="card p-5 space-y-4 dark:bg-dark-card dark:border-dark-border">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">Fotos</h2>
          <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              uploading
                ? "border-primary-300 bg-primary-50 dark:bg-primary-900/10"
                : "border-surface-border bg-surface-muted hover:border-primary-400 hover:bg-primary-50 dark:border-dark-border dark:bg-dark-surface dark:hover:border-primary-500 dark:hover:bg-primary-900/10"
            }`}
          >
            <Upload className={`mb-2 h-8 w-8 ${uploading ? "animate-pulse text-primary-500" : "text-primary-400"}`} />
            <span className="text-sm font-medium text-primary-700 dark:text-slate-300">
              {uploading ? "A fazer upload..." : "Clica para adicionar fotos"}
            </span>
            <span className="mt-1 text-xs text-primary-500 dark:text-slate-500">
              JPEG, PNG, WebP, GIF, BMP, HEIC, AVIF, TIFF · máx. 20 fotos · 50 MB cada
            </span>
            <input type="file" accept={ACCEPTED_IMAGE_TYPES} multiple className="hidden" onChange={handleImages} disabled={uploading} />
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
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-surface-muted dark:bg-dark-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeImage(url)}
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

        <button type="submit" disabled={submitting || uploading}
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

// ── Page export ───────────────────────────────────────────────────────────────
export default function PublicarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
      }
    >
      <PublicarInner />
    </Suspense>
  );
}
