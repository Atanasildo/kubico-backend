"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { propertyApi, paymentApi } from "@/lib/api";
import { PropertyListItem, Payment } from "@/types";
import { PropertyCard } from "@/components/property/PropertyCard";
import { formatPrice, timeAgo } from "@/lib/utils";
import {
  Plus, Star, User, CreditCard, Home, Eye, Heart,
  Settings, ShieldCheck, ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myProperties, setMyProperties] = useState<PropertyListItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    propertyApi.mine().then(({ data }) => setMyProperties(data.items ?? [])).finally(() => setLoadingProps(false));
    paymentApi.myPayments().then(({ data }) => setPayments(data.items ?? [])).catch(() => {});
  }, [user]);

  if (authLoading || !user) return null;

  const isAgente = user.role === "agente" || user.role === "admin";
  const planoExpira = user.plano_agente_expira_em
    ? new Date(user.plano_agente_expira_em)
    : null;
  const planoAtivo = planoExpira && planoExpira > new Date();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-950">
            Olá, {user.nome.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-primary-500">
            Gere os teus anúncios e conta
          </p>
        </div>
        <Link href="/dashboard/publicar" className="btn-primary">
          <Plus className="h-4 w-4" />
          Publicar anúncio
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Anúncios activos", value: myProperties.filter(p => p.status === "ativo").length, icon: Home, color: "text-primary-600 bg-primary-50" },
          { label: "Visualizações", value: "—", icon: Eye, color: "text-terra-600 bg-terra-50" },
          { label: "Favoritos recebidos", value: "—", icon: Heart, color: "text-red-500 bg-red-50" },
          { label: "Plano", value: isAgente ? "Agente" : "Particular", icon: Star, color: "text-green-600 bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="font-display text-xl font-bold text-primary-900">{s.value}</div>
            <div className="text-xs text-primary-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Plano agente CTA */}
      {!isAgente && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-terra-600 to-terra-700 p-5 text-white flex items-center justify-between gap-4">
          <div>
            <div className="font-display font-bold">Passa para o Plano Agente</div>
            <div className="mt-0.5 text-sm text-terra-100">
              Anúncios ilimitados por 8 000 Kz/mês
            </div>
          </div>
          <Link href="/dashboard/plano" className="shrink-0 btn-primary bg-white text-terra-700 hover:bg-terra-50">
            Ver plano
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Account alerts */}
      <div className="mb-8 space-y-2">
        {!user.email_verificado && (
          <div className="flex items-center justify-between rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <span>⚠️ Verifica o teu email para activar a conta.</span>
            <Link href="/dashboard/verificar" className="font-semibold hover:underline">
              Verificar
            </Link>
          </div>
        )}
      </div>

      {/* My listings */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-primary-900">
            Os meus anúncios
          </h2>
          <Link href="/dashboard/anuncios" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            Ver todos
          </Link>
        </div>

        {loadingProps ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-64 rounded-2xl bg-surface-muted animate-pulse" />)}
          </div>
        ) : myProperties.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-12 text-center">
            <Home className="mb-3 h-10 w-10 text-primary-300" />
            <p className="font-medium text-primary-700">Ainda não publicaste nenhum anúncio.</p>
            <Link href="/dashboard/publicar" className="btn-primary mt-4">
              <Plus className="h-4 w-4" />
              Publicar agora
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myProperties.slice(0, 6).map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-primary-900">Conta</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { href: "/dashboard/perfil", icon: User, label: "Editar perfil" },
            { href: "/dashboard/favoritos", icon: Heart, label: "Favoritos" },
            { href: "/dashboard/pagamentos", icon: CreditCard, label: "Pagamentos" },
            { href: "/dashboard/verificar", icon: ShieldCheck, label: "Verificação" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="card flex items-center gap-3 p-4 hover:shadow-card-hover"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <l.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-primary-800">{l.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-primary-400" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
