"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { PropertyListItem } from "@/types";
import { formatPrice, tipoNegocioLabel, timeAgo } from "@/lib/utils";
import {
  ArrowLeft, ShieldCheck, Flag, CheckCircle2, XCircle,
  ShieldOff, Home, AlertTriangle, Users, RefreshCw,
} from "lucide-react";

interface Report {
  id: string;
  imovel_id: string;
  denunciante_id: string;
  motivo: string;
  descricao: string;
  criado_em: string;
}

type Tab = "pending" | "reports";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<PropertyListItem[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
    if (!authLoading && user && user.role !== "admin") router.push("/dashboard");
  }, [user, authLoading, router]);

  const fetchPending = async () => {
    const { data } = await api.get("/admin/properties/pending?limit=50");
    setPending(Array.isArray(data) ? data : (data.items ?? []));
  };

  const fetchReports = async () => {
    const { data } = await api.get("/admin/reports?limit=50");
    setReports(Array.isArray(data) ? data : (data.items ?? []));
  };

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    Promise.all([fetchPending(), fetchReports()]).finally(() => setLoading(false));
  }, [user]);

  const approve = async (id: string) => {
    setActing(id);
    try {
      await api.post(`/admin/properties/${id}/approve`);
      setPending((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Erro ao aprovar.");
    } finally {
      setActing(null);
    }
  };

  const suspend = async (id: string) => {
    const reason = prompt("Razão da suspensão:");
    if (!reason) return;
    setActing(id);
    try {
      await api.post(`/admin/properties/${id}/suspend?reason=${encodeURIComponent(reason)}`);
      setPending((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Erro ao suspender.");
    } finally {
      setActing(null);
    }
  };

  const verify = async (id: string) => {
    setActing(id);
    try {
      await api.post(`/admin/properties/${id}/verify`);
      setPending((prev) =>
        prev.map((p) => (p.id === id ? { ...p, verificado: true } : p))
      );
    } catch {
      alert("Erro ao verificar.");
    } finally {
      setActing(null);
    }
  };

  if (authLoading || !user) return null;
  if (user.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-white text-primary-600 shadow-sm hover:bg-surface-muted dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-950 dark:text-white">
            Painel Admin
          </h1>
          <p className="text-sm text-primary-500 dark:text-slate-400">
            Moderação de imóveis e denúncias
          </p>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            await Promise.all([fetchPending(), fetchReports()]);
            setLoading(false);
          }}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-white text-primary-500 hover:bg-surface-muted dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-elevated transition-colors"
          title="Actualizar"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Pendentes de aprovação", value: pending.length, icon: AlertTriangle, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300" },
          { label: "Denúncias por resolver", value: reports.length, icon: Flag, color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300" },
          { label: "A moderar como", value: user.nome.split(" ")[0], icon: Users, color: "text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-300" },
        ].map((s) => (
          <div key={s.label} className="card p-4 dark:bg-dark-card dark:border-dark-border">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="font-display text-xl font-bold text-primary-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-primary-500 dark:text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-surface-border bg-surface-muted p-1 dark:border-dark-border dark:bg-dark-surface">
        {(["pending", "reports"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-primary-900 shadow-sm dark:bg-dark-elevated dark:text-white"
                : "text-primary-500 hover:text-primary-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t === "pending" ? `Pendentes (${pending.length})` : `Denúncias (${reports.length})`}
          </button>
        ))}
      </div>

      {/* Pending */}
      {tab === "pending" && (
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-surface-muted animate-pulse dark:bg-dark-surface" />
            ))
          ) : pending.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-12 text-center dark:bg-dark-card dark:border-dark-border">
              <CheckCircle2 className="mb-3 h-10 w-10 text-green-400" />
              <p className="font-medium text-primary-700 dark:text-slate-300">Nenhum imóvel pendente.</p>
            </div>
          ) : (
            pending.map((p) => (
              <div key={p.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center dark:bg-dark-card dark:border-dark-border">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-muted dark:bg-dark-surface">
                  {p.imagens && p.imagens.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imagens[0]} alt={p.titulo} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Home className="h-6 w-6 text-primary-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-primary-900 dark:text-white">{p.titulo}</p>
                  <p className="text-sm font-bold text-primary-600 dark:text-terra-400">
                    {formatPrice(p.preco, p.moeda)} · {tipoNegocioLabel(p.tipo_negocio)}
                  </p>
                  <p className="text-xs text-primary-400 dark:text-slate-500">
                    {p.municipio}, {p.provincia} · {timeAgo(p.criado_em)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/imoveis/${p.id}`}
                    className="rounded-xl border border-surface-border px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-surface-muted dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-elevated transition-colors"
                    target="_blank"
                  >
                    Ver
                  </Link>
                  {!p.verificado && (
                    <button
                      onClick={() => verify(p.id)}
                      disabled={acting === p.id}
                      className="flex items-center gap-1 rounded-xl bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-50 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verificar
                    </button>
                  )}
                  <button
                    onClick={() => approve(p.id)}
                    disabled={acting === p.id}
                    className="flex items-center gap-1 rounded-xl bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => suspend(p.id)}
                    disabled={acting === p.id}
                    className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    Suspender
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports */}
      {tab === "reports" && (
        <div className="space-y-3">
          {loading ? (
            [1, 2].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-surface-muted animate-pulse dark:bg-dark-surface" />
            ))
          ) : reports.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-12 text-center dark:bg-dark-card dark:border-dark-border">
              <CheckCircle2 className="mb-3 h-10 w-10 text-green-400" />
              <p className="font-medium text-primary-700 dark:text-slate-300">Nenhuma denúncia pendente.</p>
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="card p-4 dark:bg-dark-card dark:border-dark-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Flag className="h-4 w-4 shrink-0 text-red-500" />
                      <span className="text-sm font-semibold text-primary-900 dark:text-white capitalize">
                        {r.motivo.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-primary-400 dark:text-slate-500">
                        {timeAgo(r.criado_em)}
                      </span>
                    </div>
                    {r.descricao && (
                      <p className="mt-1 text-xs text-primary-500 dark:text-slate-400 line-clamp-2">
                        {r.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/imoveis/${r.imovel_id}`}
                      className="rounded-xl border border-surface-border px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-surface-muted dark:border-dark-border dark:text-slate-300 dark:hover:bg-dark-elevated transition-colors"
                      target="_blank"
                    >
                      Ver imóvel
                    </Link>
                    <button
                      onClick={() => suspend(r.imovel_id)}
                      disabled={acting === r.imovel_id}
                      className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Suspender
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
