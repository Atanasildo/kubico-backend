import Link from "next/link";
import { Home } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-surface-border bg-primary-950 text-primary-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <Home className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">Kubico</span>
            </div>
            <p className="text-sm text-primary-400 leading-relaxed">
              A plataforma angolana de imóveis para arrendamento e venda.
            </p>
          </div>

          {/* Imóveis */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Imóveis</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/imoveis?tipo_negocio=arrendamento" className="hover:text-white transition-colors">Arrendar</Link></li>
              <li><Link href="/imoveis?tipo_negocio=venda" className="hover:text-white transition-colors">Comprar</Link></li>
              <li><Link href="/dashboard/publicar" className="hover:text-white transition-colors">Publicar anúncio</Link></li>
            </ul>
          </div>

          {/* Conta */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Conta</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Criar conta</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Entrar</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/termos" className="hover:text-white transition-colors">Termos de uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-800 pt-6 text-center text-xs text-primary-500">
          © {new Date().getFullYear()} Kubico. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
