"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userApi, uploadApi } from "@/lib/api";
import { provincias } from "@/lib/utils";
import { Camera, CheckCircle2 } from "lucide-react";

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

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { data } = await uploadApi.profilePhoto(file);
      setPhotoUrl(data.url);
      await userApi.update({ foto_perfil_url: data.url });
      await refresh();
    } catch {} finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });
      await userApi.update(payload);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {} finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-primary-950">Editar perfil</h1>

      {/* Photo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-primary-100 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-3xl font-bold text-primary-600">
                {user.nome[0]}
              </span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary-600 text-white shadow-sm hover:bg-primary-700">
            <Camera className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploadingPhoto} />
          </label>
        </div>
        {uploadingPhoto && <p className="mt-2 text-xs text-primary-500">A actualizar foto...</p>}
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Nome completo *</label>
          <input value={form.nome} onChange={set("nome")} required minLength={2} className="input" />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input type="tel" value={form.telefone} onChange={set("telefone")} placeholder="+244 9XX XXX XXX" className="input" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Província</label>
            <select value={form.provincia} onChange={set("provincia")} className="input">
              <option value="">Seleccionar</option>
              {provincias().map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Município</label>
            <input value={form.municipio} onChange={set("municipio")} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Nome da empresa (agentes)</label>
          <input value={form.nome_empresa} onChange={set("nome_empresa")} placeholder="Opcional" className="input" />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea value={form.bio} onChange={set("bio")} rows={3} maxLength={500} placeholder="Conta um pouco sobre ti..." className="input resize-none" />
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Perfil actualizado com sucesso!
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </form>
    </div>
  );
}
