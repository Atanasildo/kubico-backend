"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, Home, Heart, Bell, User, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navLinks = [
    { href: "/imoveis", label: "Imóveis" },
    { href: "/imoveis?tipo_negocio=arrendamento", label: "Arrendamento" },
    { href: "/imoveis?tipo_negocio=venda", label: "Venda" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-primary-900">
            Kubico
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary-600",
                pathname === l.href
                  ? "text-primary-600"
                  : "text-primary-700"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                href="/dashboard/publicar"
                className="btn-primary text-xs px-4 py-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Publicar
              </Link>
              <Link
                href="/dashboard/favoritos"
                className="rounded-xl p-2 text-primary-600 hover:bg-primary-50"
              >
                <Heart className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl border border-surface-border px-3 py-1.5 text-sm font-medium text-primary-800 hover:bg-surface-muted"
              >
                <User className="h-4 w-4" />
                {user.nome.split(" ")[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-xl p-2 text-primary-400 hover:text-primary-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-secondary text-xs px-4 py-2">
                Entrar
              </Link>
              <Link href="/auth/register" className="btn-primary text-xs px-4 py-2">
                Criar conta
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-xl p-2 text-primary-700 md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-surface-border bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-primary-700"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-surface-border pt-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard/publicar"
                    className="btn-primary justify-center"
                    onClick={() => setOpen(false)}
                  >
                    <Plus className="h-4 w-4" />
                    Publicar anúncio
                  </Link>
                  <Link
                    href="/dashboard"
                    className="btn-secondary justify-center"
                    onClick={() => setOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Minha conta
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setOpen(false); }}
                    className="text-sm text-primary-500 text-center py-1"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn-secondary justify-center" onClick={() => setOpen(false)}>
                    Entrar
                  </Link>
                  <Link href="/auth/register" className="btn-primary justify-center" onClick={() => setOpen(false)}>
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
