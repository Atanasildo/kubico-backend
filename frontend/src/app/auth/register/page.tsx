"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Eye, EyeOff } from "lucide-react";
import { authApi, tokenStorage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { refresh } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    password: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        nome: form.nome,
        email: form.email,
        password: form.password,
      };
      if (form.telefone) payload.telefone = form.telefone;
      const { data } = await authApi.register(payload);
      tokenStorage.set(data.access_token, data.refresh_token);
      await refresh();
      router.push("/dashboard");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string" ? detail : "Erro ao criar conta. Tenta novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600">
            <Home className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary-950">
            Criar conta gratuita
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            Publica e gere os teus imóveis
          </p>
        </div>

        <div className="card p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <input
                type="text"
                value={form.nome}
                onChange={set("nome")}
                placeholder="João Silva"
                required
                minLength={2}
                className="input"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="teu@email.com"
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Telefone (opcional)</label>
              <input
                type="tel"
                value={form.telefone}
                onChange={set("telefone")}
                placeholder="+244 9XX XXX XXX"
                className="input"
              />
            </div>

            <div>
              <label className="label">Palavra-passe</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirmar palavra-passe</label>
              <input
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="Repete a palavra-passe"
                required
                className="input"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? "A criar conta..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-primary-500">
            Já tens conta?{" "}
            <Link href="/auth/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
