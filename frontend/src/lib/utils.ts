import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(preco: string | number, moeda = "AOA"): string {
  const n = typeof preco === "string" ? parseFloat(preco) : preco;
  if (isNaN(n)) return "—";
  if (moeda === "AOA") {
    return (
      n.toLocaleString("pt-AO", { maximumFractionDigits: 0 }) + " Kz"
    );
  }
  return n.toLocaleString("pt-AO", {
    style: "currency",
    currency: moeda,
    maximumFractionDigits: 0,
  });
}

export function tipoImovelLabel(tipo: string): string {
  const map: Record<string, string> = {
    apartamento: "Apartamento",
    casa: "Casa",
    terreno: "Terreno",
    loja: "Loja",
    escritorio: "Escritório",
    armazem: "Armazém",
    quarto: "Quarto",
    outro: "Outro",
  };
  return map[tipo] ?? tipo;
}

export function tipoNegocioLabel(tipo: string): string {
  return tipo === "arrendamento" ? "Arrendamento" : "Venda";
}

export function provincias(): string[] {
  return [
    "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango",
    "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla",
    "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico",
    "Namibe", "Uíge", "Zaire",
  ];
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}m`;
}

export function getFirstImage(imagens?: string[]): string {
  return imagens?.[0] ?? "/placeholder-property.svg";
}
