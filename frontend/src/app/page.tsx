import { SearchBar } from "@/components/property/SearchBar";
import { PropertyCard } from "@/components/property/PropertyCard";
import { ArrowRight, ShieldCheck, Star, Users } from "lucide-react";
import Link from "next/link";

async function getFeaturedProperties() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/properties/?limit=6`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProperties();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 px-4 pb-24 pt-20 sm:px-6">
        {/* Manchas de luz orgânicas */}
        <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary-700/25 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-terra-500/15 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-64 rounded-full bg-primary-600/20 blur-[60px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Tagline discreta — sem badge circular */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-terra-400/80">
            Imóveis em Angola
          </p>

          <h1 className="mb-5 font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl md:text-6xl">
            Encontra o teu
            <br />
            <span className="text-terra-400">lar perfeito</span>
          </h1>

          <p className="mb-10 mx-auto max-w-xl text-base text-primary-300/90 sm:text-lg">
            Milhares de imóveis para arrendar e comprar nas 21 províncias de Angola.
          </p>

          <div className="mx-auto max-w-3xl">
            <SearchBar />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-primary-400">
            <span className="flex items-center gap-1.5"><span className="text-base">🏠</span> Apartamentos</span>
            <span className="flex items-center gap-1.5"><span className="text-base">🏡</span> Casas</span>
            <span className="flex items-center gap-1.5"><span className="text-base">🏗️</span> Terrenos</span>
            <span className="flex items-center gap-1.5"><span className="text-base">🏪</span> Lojas</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-surface-border bg-surface-muted py-14 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Imóveis verificados",
              desc: "Anúncios revistos pela nossa equipa para garantir autenticidade.",
              color: "text-primary-600 bg-primary-100",
            },
            {
              icon: Star,
              title: "Agentes de confiança",
              desc: "Agentes certificados com plano profissional e histórico visível.",
              color: "text-terra-600 bg-terra-100",
            },
            {
              icon: Users,
              title: "Contacto directo",
              desc: "Liga por WhatsApp ou telefone directamente com o proprietário.",
              color: "text-green-600 bg-green-100",
            },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-display text-base font-bold text-primary-900">
                {f.title}
              </h3>
              <p className="text-sm text-primary-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured listings */}
      {featured.length > 0 && (
        <section className="py-14 px-4 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-primary-900">
                  Imóveis em destaque
                </h2>
                <p className="mt-1 text-sm text-primary-500">
                  Os melhores anúncios seleccionados para ti
                </p>
              </div>
              <Link
                href="/imoveis"
                className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p: any) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA agente */}
      <section className="mx-4 mb-14 overflow-hidden rounded-3xl bg-gradient-to-br from-terra-600 to-terra-700 px-8 py-12 text-center sm:mx-6">
        <h2 className="mb-3 font-display text-2xl font-extrabold text-white sm:text-3xl">
          És agente imobiliário?
        </h2>
        <p className="mb-6 text-terra-100">
          Publica anúncios ilimitados por apenas{" "}
          <strong className="text-white">8 000 Kz/mês</strong> com o Plano Agente.
        </p>
        <Link href="/auth/register" className="btn-primary bg-white text-terra-700 hover:bg-terra-50">
          Começar agora
        </Link>
      </section>
    </>
  );
}
