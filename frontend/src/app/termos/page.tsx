import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Termos e Condições",
  description: "Termos e condições de utilização da plataforma Kubico.",
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-white text-primary-600 shadow-sm hover:bg-surface-muted dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-primary-950 dark:text-white">
          Termos e Condições
        </h1>
      </div>

      <div className="card p-8 space-y-6 text-sm text-primary-700 dark:bg-dark-card dark:border-dark-border dark:text-slate-300 leading-relaxed">
        <p className="text-xs text-primary-400 dark:text-slate-500">
          Última actualização: Novembro de 2026
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            1. Aceitação dos termos
          </h2>
          <p>
            Ao criar uma conta ou utilizar a plataforma <strong>Kubico</strong>, concordas com
            estes Termos e Condições. Se não concordares, não deves utilizar os nossos serviços.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            2. Descrição do serviço
          </h2>
          <p>
            O Kubico é uma plataforma angolana de anúncios imobiliários que permite a
            utilizadores publicar, pesquisar e contactar sobre imóveis para arrendamento e venda
            em Angola.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            3. Responsabilidades do utilizador
          </h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Publicar apenas anúncios de imóveis reais e com informações verdadeiras</li>
            <li>Não publicar conteúdo enganoso, fraudulento ou ilegal</li>
            <li>Não utilizar a plataforma para fins de spam ou publicidade não solicitada</li>
            <li>Manter as credenciais de acesso em segurança</li>
            <li>Respeitar os outros utilizadores e não assediar ou discriminar</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            4. Publicação de anúncios
          </h2>
          <p>
            Contas particulares têm limite de 2 anúncios activos simultâneos. O plano Agente
            oferece anúncios ilimitados. O Kubico reserva o direito de remover anúncios que
            violem estas condições sem aviso prévio.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            5. Pagamentos e planos
          </h2>
          <p>
            Os pagamentos do Plano Agente e destaques são processados através de referência
            Multicaixa. Não são emitidos reembolsos após a activação de um plano ou destaque,
            excepto em casos de falha técnica comprovada da nossa parte.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            6. Limitação de responsabilidade
          </h2>
          <p>
            O Kubico actua como intermediário entre anunciantes e potenciais clientes. Não somos
            parte nas transacções imobiliárias e não nos responsabilizamos por eventuais
            discrepâncias entre anúncios e imóveis reais. Recomendamos sempre a visita presencial
            antes de qualquer acordo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            7. Suspensão e encerramento de contas
          </h2>
          <p>
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos,
            publiquem conteúdo fraudulento ou prejudiquem outros utilizadores, sem necessidade
            de aviso prévio.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            8. Alterações aos termos
          </h2>
          <p>
            Podemos actualizar estes termos a qualquer momento. A continuação do uso da
            plataforma após alterações constitui aceitação dos novos termos.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            9. Contacto
          </h2>
          <p>
            Para questões sobre estes termos, contacta-nos em{" "}
            <a
              href="mailto:suporte@kubico.ao"
              className="text-primary-600 hover:underline dark:text-terra-400"
            >
              suporte@kubico.ao
            </a>
            .
          </p>
        </section>

        <div className="border-t border-surface-border dark:border-dark-border pt-4">
          <Link
            href="/privacidade"
            className="text-sm font-semibold text-primary-600 hover:underline dark:text-terra-400"
          >
            Ver também: Política de Privacidade →
          </Link>
        </div>
      </div>
    </div>
  );
}
