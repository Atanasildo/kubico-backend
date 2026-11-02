"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { userApi, uploadApi } from "@/lib/api";
import { provincias } from "@/lib/utils";
import { ArrowLeft, Camera, CheckCircle2, AlertCircle } from "lucide-react";

export default function PerfilPage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    provincia: "",
    municipio: "",
    bio: "",
    nome_empresa: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        nome: user.nome ?? "",
        telefone: user.telefone ?? "",
        provincia: user.provincia ?? "",
        municipio: user.municipio ?? "",
        bio: user.bio ?? "",
        nome_empresa: user.nome_empresa ?? "",
      });
      setPhotoUrl(user.foto_perfil_url ?? null);
    }
  }, [user]);

  const set =
    (k: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const { data } = await uploadApi.profilePhoto(file);
      const url: string = data.url;
      setPhotoUrl(url);
      await userApi.update({ foto_perfil_url: url });
      await refresh();
    } catch {
      setError("Falha ao carregar foto. Tenta novamente.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: Record<string, string> = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v) payload[k] = v;
      });
      await userApi.update(payload);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch {
      setError("Erro ao guardar. Verifica a tua ligação e tenta novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  // Resolve photo — if the URL is relative (starts with /uploads), prepend the API base
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "";
  const resolvedPhoto =
    photoUrl && photoUrl.startsWith("/")
      ? `${apiBase}${photoUrl}`
      : photoUrl;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      {/* Back + title */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-white text-primary-600 shadow-sm hover:bg-surface-muted dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-primary-950 dark:text-white">
          Editar perfil
        </h1>
      </div>

      {/* Photo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-primary-100 dark:bg-dark-elevated flex items-center justify-center ring-4 ring-white dark:ring-dark-card shadow-md">
            {resolvedPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolvedPhoto}
                alt="Foto de perfil"
                className="h-full w-full object-cover"
                onError={() => setPhotoUrl(null)}
              />
            ) : (
              <span className="font-display text-3xl font-bold text-primary-600 dark:text-primary-400">
                {user.nome[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary-600 text-white shadow-sm hover:bg-primary-700 transition-colors">
            <Camera className="h-4 w-4" />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhoto}
              disabled={uploadingPhoto}
            />
          </label>
        </div>
        {uploadingPhoto && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-primary-500 dark:text-slate-400">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            A actualizar foto...
          </p>
        )}
        <p className="mt-2 text-xs text-primary-400 dark:text-slate-500">
          JPEG, PNG ou WebP · Máx. 50 MB
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 dark:bg-dark-card dark:border-dark-border">
        <div>
          <label className="label">Nome completo *</label>
          <input
            value={form.nome}
            onChange={set("nome")}
            required
            minLength={2}
            className="input"
            placeholder="O teu nome completo"
          />
        </div>

        <div>
          <label className="label">Telefone</label>
          <input
            type="tel"
            value={form.telefone}
            onChange={set("telefone")}
            placeholder="+244 9XX XXX XXX"
            className="input"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Província</label>
            <select
              value={form.provincia}
              onChange={set("provincia")}
              className="input"
            >
              <option value="">Seleccionar</option>
              {provincias().map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Município</label>
            <input
              value={form.municipio}
              onChange={set("municipio")}
              placeholder="Ex: Talatona"
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Nome da empresa (agentes)</label>
          <input
            value={form.nome_empresa}
            onChange={set("nome_empresa")}
            placeholder="Opcional"
            className="input"
          />
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea
            value={form.bio}
            onChange={set("bio")}
            rows={3}
            maxLength={500}
            placeholder="Conta um pouco sobre ti..."
            className="input resize-none"
          />
          <p className="mt-1 text-right text-xs text-primary-400 dark:text-slate-500">
            {form.bio.length}/500
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Perfil actualizado com sucesso!
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full justify-center py-3"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              A guardar...
            </>
          ) : (
            "Guardar alterações"
          )}
        </button>
      </form>
    </div>
  );
}
