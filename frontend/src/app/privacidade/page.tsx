import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade",
  description: "Como o Kubico trata os teus dados pessoais.",
};

export default function PrivacidadePage() {
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
          Política de Privacidade
        </h1>
      </div>

      <div className="card p-8 space-y-6 text-sm text-primary-700 dark:bg-dark-card dark:border-dark-border dark:text-slate-300 leading-relaxed">
        <p className="text-xs text-primary-400 dark:text-slate-500">
          Última actualização: Novembro de 2026
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            1. Quem somos
          </h2>
          <p>
            O <strong>Kubico</strong> é uma plataforma angolana de imóveis para
            arrendamento e venda. Operamos em Angola e tratamos os dados dos
            nossos utilizadores com respeito e transparência.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            2. Dados que recolhemos
          </h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Nome, email e número de telefone fornecidos no registo</li>
            <li>Fotografias de perfil e de imóveis que carregas</li>
            <li>Informações dos anúncios que publicas</li>
            <li>Dados de utilização (páginas visitadas, pesquisas realizadas)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            3. Como usamos os teus dados
          </h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Para criar e gerir a tua conta</li>
            <li>Para publicar e apresentar os teus anúncios</li>
            <li>Para melhorar os nossos serviços</li>
            <li>Para comunicar contigo sobre a tua conta</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            4. Partilha de dados
          </h2>
          <p>
            Não vendemos os teus dados a terceiros. As informações de contacto
            dos anúncios são visíveis publicamente apenas quando as forneces
            voluntariamente ao criar um anúncio.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            5. Os teus direitos
          </h2>
          <p>
            Podes a qualquer momento editar o teu perfil, apagar os teus
            anúncios ou solicitar a eliminação da tua conta através das
            definições da conta ou por contacto directo connosco.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            6. Segurança
          </h2>
          <p>
            As tuas senhas são armazenadas de forma cifrada. Utilizamos HTTPS
            em toda a plataforma e seguimos boas práticas de segurança para
            proteger os teus dados.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-base font-bold text-primary-900 dark:text-white">
            7. Contacto
          </h2>
          <p>
            Para questões sobre privacidade, contacta-nos em{" "}
            <a
              href="mailto:suporte@kubico.ao"
              className="text-primary-600 hover:underline dark:text-terra-400"
            >
              suporte@kubico.ao
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
