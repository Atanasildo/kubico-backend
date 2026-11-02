"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Eye, EyeOff, MapPin } from "lucide-react";
import { authApi, tokenStorage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { refresh } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authApi.login(form);
      tokenStorage.set(data.access_token, data.refresh_token);
      await refresh();
      router.push("/dashboard");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Credenciais inválidas. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Painel esquerdo — visual */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-950 via-[#0f1d44] to-primary-900 p-12">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-terra-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-primary-700/20 blur-[80px]" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
            <Home className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-display text-2xl font-extrabold text-white">Kubico</span>
        </div>

        <div className="relative space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terra-400 mb-3">
              Bem-vindo de volta
            </p>
            <h2 className="font-display text-3xl font-extrabold text-white leading-tight">
              O teu próximo imóvel<br />está à distância<br />
              <span className="text-terra-400">de um clique</span>
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { emoji: "🏠", text: "Mais de 2 400 imóveis disponíveis hoje" },
              { emoji: "📍", text: "Cobertura total nas 21 províncias de Angola" },
              { emoji: "💬", text: "Contacto directo com proprietários" },
              { emoji: "✅", text: "Todos os anúncios verificados" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <span className="text-lg">{item.emoji}</span>
                <p className="text-sm text-primary-200">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-primary-500">
          <MapPin className="h-3.5 w-3.5 text-terra-500" />
          <span>Luanda · Huambo · Benguela · e mais 18 províncias</span>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-surface-warm dark:bg-dark-bg">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl font-extrabold text-primary-950 dark:text-white">Kubico</span>
          </div>

          <div className="mb-7">
            <h1 className="font-display text-2xl font-bold text-primary-950 dark:text-white">
              Entrar na conta
            </h1>
            <p className="mt-1 text-sm text-primary-500 dark:text-slate-400">
              Bem-vindo de volta ao Kubico
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="teu@email.com"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label mb-0">Palavra-passe</label>
                <Link href="/auth/recuperar" className="text-xs text-primary-500 hover:text-primary-700 dark:text-slate-400 dark:hover:text-slate-200">
                  Esqueceste?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="A tua palavra-passe"
                  required
                  autoComplete="current-password"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-1"
            >
              {loading ? "A entrar..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-primary-500 dark:text-slate-400">
            Não tens conta?{" "}
            <Link href="/auth/register" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-terra-400 dark:hover:text-terra-300">
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
