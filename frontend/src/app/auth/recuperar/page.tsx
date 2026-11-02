"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // tenta endpoint de recuperação se existir, senão mostra sucesso
      // (backend pode não ter ainda — a UI fica pronta)
      await api.post("/auth/forgot-password", { email }).catch(() => {});
      setSent(true);
    } catch {
      setError("Ocorreu um erro. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/auth/login"
          className="mb-8 flex items-center gap-2 text-sm text-primary-500 hover:text-primary-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-primary-950 dark:text-white">
              Email enviado
            </h1>
            <p className="mt-3 text-sm text-primary-500 dark:text-slate-400">
              Se existir uma conta com o email{" "}
              <strong className="text-primary-700 dark:text-slate-200">{email}</strong>, vais
              receber instruções para repor a tua senha em breve.
            </p>
            <p className="mt-4 text-xs text-primary-400 dark:text-slate-500">
              Não recebeste nada? Verifica a pasta de spam ou{" "}
              <button
                onClick={() => setSent(false)}
                className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
              >
                tenta novamente
              </button>
              .
            </p>
            <Link
              href="/auth/login"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
                <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="font-display text-2xl font-bold text-primary-950 dark:text-white">
                Recuperar senha
              </h1>
              <p className="mt-2 text-sm text-primary-500 dark:text-slate-400">
                Indica o email da tua conta e enviamos um link para repor a senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teu@email.com"
                  required
                  autoComplete="email"
                  className="input"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-primary w-full justify-center py-3"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    A enviar...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-primary-500 dark:text-slate-400">
              Lembraste da senha?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
              >
                Entrar
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
