import { SearchBar } from "@/components/property/SearchBar";
import { PropertyCard } from "@/components/property/PropertyCard";
import { FeaturedCarousel } from "@/components/property/FeaturedCarousel";
import { ArrowRight, ShieldCheck, Star, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function getFeaturedProperties() {
  try {
    const res = await fetch(`${API}/properties/?limit=12`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.items ?? []);
  } catch { return []; }
}

async function getRecentProperties() {
  try {
    const res = await fetch(`${API}/properties/?limit=6`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.items ?? []);
  } catch { return []; }
}

const CATEGORIES = [
  { label: "Apartamentos", emoji: "🏠", q: "tipo_imovel=apartamento" },
  { label: "Casas",        emoji: "🏡", q: "tipo_imovel=casa" },
  { label: "Terrenos",     emoji: "🏗️",  q: "tipo_imovel=terreno" },
  { label: "Lojas",        emoji: "🏪", q: "tipo_imovel=loja" },
  { label: "Escritórios",  emoji: "🏢", q: "tipo_imovel=escritorio" },
  { label: "Armazéns",     emoji: "🏭", q: "tipo_imovel=armazem" },
];

const TOP_PROVINCES = [
  { name: "Luanda",     emoji: "🏙️" },
  { name: "Benguela",   emoji: "🌊" },
  { name: "Huíla",      emoji: "🌿" },
  { name: "Huambo",     emoji: "⛰️" },
  { name: "Cabinda",    emoji: "🛢️" },
  { name: "Malanje",    emoji: "🌾" },
];

export default async function HomePage() {
  const [featured, recent] = await Promise.all([
    getFeaturedProperties(),
    getRecentProperties(),
  ]);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-[#0f1d44] to-primary-900 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg px-4 pb-24 pt-20 sm:px-6">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-primary-700/20 blur-[140px]" />
        <div className="pointer-events-none absolute left-1/4 top-1/2 h-96 w-96 rounded-full bg-terra-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary-800/30 blur-[80px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-terra-400">
            Imóveis em Angola
          </p>
          <h1 className="mb-5 font-display text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl md:text-[3.75rem]">
            Encontra o teu
            <br />
            <span className="bg-gradient-to-r from-terra-400 to-terra-300 bg-clip-text text-transparent">
              lar perfeito
            </span>
          </h1>
          <p className="mb-10 mx-auto max-w-xl text-base text-primary-300/85 sm:text-lg">
            Milhares de imóveis para arrendar e comprar nas 21 províncias de Angola.
          </p>

          {/* SearchBar */}
          <div className="mx-auto max-w-3xl">
            <SearchBar />
          </div>

          {/* Category quick-links */}
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.label}
                href={`/imoveis?${c.q}`}
                className="flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-medium text-primary-200 backdrop-blur-sm transition-all hover:bg-white/16 hover:text-white hover:border-white/25 hover:scale-105"
              >
                <span>{c.emoji}</span>
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="border-b border-surface-border bg-white dark:border-dark-border dark:bg-dark-surface">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
            {[
              { value: "2 400+", label: "Imóveis listados",    color: "text-primary-700 dark:text-terra-400" },
              { value: "21",     label: "Províncias cobertas", color: "text-primary-700 dark:text-terra-400" },
              { value: "180+",   label: "Agentes activos",     color: "text-primary-700 dark:text-terra-400" },
              { value: "98%",    label: "Satisfação",          color: "text-primary-700 dark:text-terra-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface-muted dark:bg-dark-elevated px-4 py-4">
                <p className={`font-display text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-xs text-primary-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Carrossel destaques ── */}
      {featured.length > 0 && (
        <section className="py-14 px-4 sm:px-6 overflow-hidden bg-white dark:bg-dark-bg">
          <div className="mx-auto max-w-7xl mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-primary-900 dark:text-white">
                Anúncios em destaque
              </h2>
              <p className="mt-1 text-sm text-primary-500 dark:text-slate-400">
                Seleccionados pela nossa equipa
              </p>
            </div>
            <Link
              href="/imoveis"
              className="flex items-center gap-1.5 text-sm font-semibold text-terra-600 hover:text-terra-700 dark:text-terra-400 dark:hover:text-terra-300"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <FeaturedCarousel properties={featured} />
        </section>
      )}

      {/* ── Províncias populares ── */}
      <section className="border-y border-surface-border bg-surface-muted py-12 px-4 dark:border-dark-border dark:bg-dark-surface sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-primary-900 dark:text-white">
              Pesquisar por província
            </h2>
            <Link
              href="/imoveis"
              className="text-xs font-semibold text-terra-600 dark:text-terra-400 hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TOP_PROVINCES.map((p) => (
              <Link
                key={p.name}
                href={`/imoveis?provincia=${encodeURIComponent(p.name)}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-card p-4 text-center transition-all hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md hover:-translate-y-0.5"
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-xs font-semibold text-primary-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-terra-400 transition-colors">
                  {p.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 px-4 bg-white dark:bg-dark-bg sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-primary-900 dark:text-white">
              Porque escolher o Kubico?
            </h2>
            <p className="mt-2 text-sm text-primary-500 dark:text-slate-400">
              A plataforma de imóveis mais completa de Angola
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Imóveis verificados",
                desc: "Todos os anúncios passam pela nossa equipa antes de ficarem visíveis.",
                color: "text-primary-600 bg-primary-100 dark:bg-primary-900/40 dark:text-primary-300",
              },
              {
                icon: Star,
                title: "Agentes certificados",
                desc: "Agentes com plano profissional e histórico de transacções visível.",
                color: "text-terra-600 bg-terra-100 dark:bg-terra-900/40 dark:text-terra-300",
              },
              {
                icon: Users,
                title: "Contacto directo",
                desc: "Fala directamente com o proprietário via WhatsApp ou chamada.",
                color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300",
              },
              {
                icon: TrendingUp,
                title: "Preços de mercado",
                desc: "Dados actualizados para perceber o valor justo na tua zona.",
                color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300",
              },
            ].map((f) => (
              <div key={f.title} className="card p-6 dark:bg-dark-card dark:border-dark-border hover:shadow-md transition-shadow">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-display text-sm font-bold text-primary-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="text-xs text-primary-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recentes ── */}
      {recent.length > 0 && (
        <section className="py-14 px-4 bg-surface-muted dark:bg-dark-surface border-t border-surface-border dark:border-dark-border sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary-900 dark:text-white">
                  Publicações recentes
                </h2>
                <p className="mt-1 text-sm text-primary-500 dark:text-slate-400">
                  Os últimos anúncios adicionados
                </p>
              </div>
              <Link
                href="/imoveis"
                className="flex items-center gap-1.5 text-sm font-semibold text-terra-600 dark:text-terra-400 hover:underline"
              >
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((p: any) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA agente ── */}
      <section className="px-4 py-16 sm:px-6 dark:bg-dark-bg bg-white">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary-950 to-primary-900 dark:from-dark-surface dark:to-dark-elevated px-8 py-14 text-center relative">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-terra-500/15 blur-[80px]" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-primary-600/20 blur-[60px]" />
          <div className="relative">
            <span className="mb-3 inline-block rounded-full border border-terra-500/40 bg-terra-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-terra-400">
              Para agentes
            </span>
            <h2 className="mb-3 font-display text-2xl font-extrabold text-white sm:text-3xl">
              Publica e vende mais depressa
            </h2>
            <p className="mb-7 mx-auto max-w-md text-primary-300 dark:text-slate-400">
              Anúncios ilimitados por apenas{" "}
              <strong className="text-terra-400">8 000 Kz/mês</strong> com o Plano Agente.
              Destaque garantido nas pesquisas.
            </p>
            <Link href="/auth/register" className="btn-terra animate-pulse-glow">
              Começar agora — é grátis
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
