"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Eye, EyeOff, MapPin } from "lucide-react";
import { authApi, tokenStorage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { refresh } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
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

    if (form.senha !== form.confirm) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.senha)) {
      setError("A senha deve ter pelo menos 8 caracteres, incluindo uma letra e um número.");
      return;
    }

    setLoading(true);
    try {
      const payload: Parameters<typeof authApi.register>[0] = {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
      };
      if (form.telefone) payload.telefone = form.telefone;

      const { data } = await authApi.register(payload);
      // /register agora devolve Token directamente
      tokenStorage.set(data.access_token, data.refresh_token);
      await refresh();
      router.push("/dashboard");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        // Erros de validação Pydantic — pegar a primeira mensagem
        setError(detail[0]?.msg ?? "Erro de validação. Verifica os dados.");
      } else {
        setError("Erro ao criar conta. Tenta novamente.");
      }
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
            <Home className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-extrabold text-white tracking-tight">Kubico</span>
        </div>

        <div className="relative space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terra-400 mb-3">
              Plataforma angolana de imóveis
            </p>
            <h2 className="font-display text-3xl font-extrabold text-white leading-tight">
              Encontra ou publica<br />o teu imóvel<br />
              <span className="text-terra-400">sem complicações</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "2 400+", label: "Imóveis listados" },
              { value: "21", label: "Províncias" },
              { value: "180+", label: "Agentes activos" },
              { value: "Grátis", label: "Para compradores" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="font-display text-xl font-extrabold text-terra-400">{s.value}</p>
                <p className="text-xs text-primary-300">{s.label}</p>
              </div>
            ))}
          </div>

          <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-sm text-primary-200 italic leading-relaxed">
              "Encontrei o meu apartamento em Talatona em menos de uma semana. O processo foi simples e o proprietário contactou-me directamente."
            </p>
            <footer className="mt-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terra-500 text-xs font-bold text-white">
                CM
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Carlos M.</p>
                <p className="text-xs text-primary-400">Luanda</p>
              </div>
            </footer>
          </blockquote>
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
              Criar conta gratuita
            </h1>
            <p className="mt-1 text-sm text-primary-500 dark:text-slate-400">
              Publica e gere os teus imóveis
            </p>
          </div>

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
                autoComplete="email"
                className="input"
              />
            </div>

            <div>
              <label className="label">
                Telefone <span className="font-normal text-primary-400">(opcional)</span>
              </label>
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
                  value={form.senha}
                  onChange={set("senha")}
                  placeholder="Mínimo 8 caracteres, com letra e número"
                  required
                  minLength={8}
                  autoComplete="new-password"
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
              <p className="mt-1 text-xs text-primary-400">Pelo menos 1 letra e 1 número</p>
            </div>

            <div>
              <label className="label">Confirmar palavra-passe</label>
              <input
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="Repete a palavra-passe"
                required
                autoComplete="new-password"
                className="input"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/40">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-1"
            >
              {loading ? "A criar conta..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-primary-500 dark:text-slate-400">
            Já tens conta?{" "}
            <Link href="/auth/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-terra-400 dark:hover:text-terra-300">
              Entrar
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-primary-400 dark:text-slate-500">
            Ao criar conta, aceitas os nossos{" "}
            <Link href="/termos" className="underline hover:text-primary-600">Termos de uso</Link>
            {" "}e{" "}
            <Link href="/privacidade" className="underline hover:text-primary-600">Política de privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
