"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Home, Heart, User, LogOut, Plus, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Persistir dark mode
  useEffect(() => {
    const saved = localStorage.getItem("kubico-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("kubico-theme", next ? "dark" : "light");
  };

  // Sombra ao scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-200",
        "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85",
        "dark:bg-dark-surface/95 dark:border-dark-border",
        scrolled
          ? "border-surface-border shadow-[0_2px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_24px_rgba(0,0,0,0.5)]"
          : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-sm group-hover:shadow-glow-primary transition-shadow">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-xl font-extrabold text-primary-950 dark:text-white tracking-tight">
            Kubico
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
                pathname === l.href
                  ? "bg-primary-50 text-primary-700 dark:bg-dark-elevated dark:text-terra-400"
                  : "text-primary-700 hover:bg-surface-muted hover:text-primary-900 dark:text-slate-300 dark:hover:bg-dark-elevated dark:hover:text-white"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="rounded-xl p-2 text-primary-500 hover:bg-surface-muted dark:text-slate-400 dark:hover:bg-dark-elevated transition-colors"
            title={dark ? "Modo claro" : "Modo escuro"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <>
              <Link href="/dashboard/publicar" className="btn-terra text-xs px-4 py-2">
                <Plus className="h-3.5 w-3.5" />
                Publicar
              </Link>
              <Link
                href="/dashboard/favoritos"
                className="rounded-xl p-2 text-primary-500 hover:bg-surface-muted dark:text-slate-400 dark:hover:bg-dark-elevated transition-colors"
              >
                <Heart className="h-4.5 w-4.5" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-primary-800 hover:bg-surface-muted dark:border-dark-border dark:bg-dark-card dark:text-slate-100 dark:hover:bg-dark-elevated transition-colors"
              >
                <User className="h-4 w-4" />
                {user.nome.split(" ")[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-xl p-2 text-primary-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-surface-muted dark:text-slate-300 dark:hover:bg-dark-elevated transition-colors"
              >
                Entrar
              </Link>
              <Link href="/auth/register" className="btn-primary text-xs px-4 py-2">
                Criar conta
              </Link>
            </>
          )}
        </div>

        {/* Mobile: dark toggle + menu */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={toggleDark}
            className="rounded-xl p-2 text-primary-500 dark:text-slate-400"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            className="rounded-xl p-2 text-primary-700 dark:text-slate-300"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-surface-border bg-white px-4 py-4 dark:border-dark-border dark:bg-dark-surface md:hidden animate-fade-in">
          <div className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-primary-700 hover:bg-surface-muted dark:text-slate-300 dark:hover:bg-dark-elevated"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-surface-border pt-3 dark:border-dark-border">
              {user ? (
                <>
                  <Link href="/dashboard/publicar" className="btn-terra justify-center" onClick={() => setOpen(false)}>
                    <Plus className="h-4 w-4" /> Publicar anúncio
                  </Link>
                  <Link href="/dashboard" className="btn-secondary justify-center" onClick={() => setOpen(false)}>
                    <User className="h-4 w-4" /> Minha conta
                  </Link>
                  <button onClick={() => { handleLogout(); setOpen(false); }} className="text-sm text-primary-400 dark:text-slate-500 py-1">
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn-secondary justify-center" onClick={() => setOpen(false)}>Entrar</Link>
                  <Link href="/auth/register" className="btn-primary justify-center" onClick={() => setOpen(false)}>Criar conta</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
