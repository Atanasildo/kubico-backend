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

// ─── Hierarquia geográfica de Angola (21 províncias) ──────────────────────────

export interface GeoMunicipio {
  nome: string;
  comunas: string[];
}

export interface GeoProvincia {
  nome: string;
  municipios: GeoMunicipio[];
}

export const GEO_ANGOLA: GeoProvincia[] = [
  {
    nome: "Bengo",
    municipios: [
      { nome: "Ambriz", comunas: ["Ambriz", "Bela Vista", "Ponta do Zaire"] },
      { nome: "Bula Atumba", comunas: ["Bula Atumba", "Úcua"] },
      { nome: "Dande", comunas: ["Caxito", "Mabubas", "Panguila", "Úcua"] },
      { nome: "Dembos", comunas: ["Quibaxe", "Samba Cajú"] },
      { nome: "Nambuangongo", comunas: ["Nambuangongo", "Úcua"] },
      { nome: "Pango Aluquém", comunas: ["Pango Aluquém"] },
    ],
  },
  {
    nome: "Benguela",
    municipios: [
      { nome: "Benguela", comunas: ["Benguela", "Baía Farta", "Cubal", "Dombe Grande"] },
      { nome: "Baia Farta", comunas: ["Baía Farta", "Calohala"] },
      { nome: "Balombo", comunas: ["Balombo", "Cariango", "Nharea"] },
      { nome: "Bocoio", comunas: ["Bocoio", "Cuibal", "Nharea"] },
      { nome: "Caimbambo", comunas: ["Caimbambo", "Cutato"] },
      { nome: "Chongoroi", comunas: ["Chongoroi", "Quilengues"] },
      { nome: "Cubal", comunas: ["Cubal", "Gangula"] },
      { nome: "Ganda", comunas: ["Ganda", "Cubal"] },
      { nome: "Lobito", comunas: ["Lobito", "Catumbela", "Cavaco", "Dombolo"] },
    ],
  },
  {
    nome: "Bié",
    municipios: [
      { nome: "Camacupa", comunas: ["Camacupa", "Trumba"] },
      { nome: "Catabola", comunas: ["Catabola", "Nharea"] },
      { nome: "Chinguar", comunas: ["Chinguar", "Cuíto"] },
      { nome: "Chitembo", comunas: ["Chitembo"] },
      { nome: "Cuito", comunas: ["Cuíto", "Cancova", "Cunje", "Cutato", "Nharea"] },
      { nome: "Cunhinga", comunas: ["Cunhinga"] },
      { nome: "Kuito", comunas: ["Kuíto", "Nharea"] },
      { nome: "Malanje", comunas: ["Malanje"] },
      { nome: "Nharea", comunas: ["Nharea"] },
    ],
  },
  {
    nome: "Cabinda",
    municipios: [
      { nome: "Belize", comunas: ["Belize", "Lucula"] },
      { nome: "Buco-Zau", comunas: ["Buco-Zau", "Miconje"] },
      { nome: "Cabinda", comunas: ["Cabinda", "Malembo", "Tando Zinze"] },
      { nome: "Cacongo", comunas: ["Cacongo", "Landana"] },
    ],
  },
  {
    nome: "Cuando Cubango",
    municipios: [
      { nome: "Calai", comunas: ["Calai"] },
      { nome: "Cuangar", comunas: ["Cuangar"] },
      { nome: "Cuchi", comunas: ["Cuchi", "Mucusso"] },
      { nome: "Dirico", comunas: ["Dirico", "Mucusso"] },
      { nome: "Kuito Kuanavale", comunas: ["Kuito Kuanavale"] },
      { nome: "Mavinga", comunas: ["Mavinga"] },
      { nome: "Menongue", comunas: ["Menongue", "Caiundo", "Cunje"] },
      { nome: "Nancova", comunas: ["Nancova"] },
      { nome: "Rivungo", comunas: ["Rivungo"] },
    ],
  },
  {
    nome: "Cuanza Norte",
    municipios: [
      { nome: "Ambaca", comunas: ["Ambaca", "Banga"] },
      { nome: "Bolongongo", comunas: ["Bolongongo"] },
      { nome: "Cambambe", comunas: ["Cambambe", "Massangano"] },
      { nome: "Cazengo", comunas: ["N'Dalatando", "Lucala", "Cambundi-Catembo"] },
      { nome: "Golungo Alto", comunas: ["Golungo Alto"] },
      { nome: "Gonguembo", comunas: ["Gonguembo"] },
      { nome: "Lucala", comunas: ["Lucala"] },
      { nome: "Quiculungo", comunas: ["Quiculungo"] },
      { nome: "Samba Cajú", comunas: ["Samba Cajú"] },
    ],
  },
  {
    nome: "Cuanza Sul",
    municipios: [
      { nome: "Amboim", comunas: ["Gabela", "Conda"] },
      { nome: "Cassongue", comunas: ["Cassongue"] },
      { nome: "Cela", comunas: ["Waku Kungo", "Cela"] },
      { nome: "Conda", comunas: ["Conda"] },
      { nome: "Ebo", comunas: ["Ebo"] },
      { nome: "Libolo", comunas: ["Calulo"] },
      { nome: "Mussende", comunas: ["Mussende"] },
      { nome: "Porto Amboim", comunas: ["Porto Amboim"] },
      { nome: "Quibala", comunas: ["Quibala"] },
      { nome: "Quilenda", comunas: ["Quilenda"] },
      { nome: "Seles", comunas: ["Seles"] },
      { nome: "Sumbe", comunas: ["Sumbe", "Conda", "Porto Amboim"] },
    ],
  },
  {
    nome: "Cunene",
    municipios: [
      { nome: "Cahama", comunas: ["Cahama"] },
      { nome: "Cuanhama", comunas: ["Ondjiva", "Ombadja"] },
      { nome: "Curoca", comunas: ["Curoca"] },
      { nome: "Cuvelai", comunas: ["Cuvelai", "Evale"] },
      { nome: "Namacunde", comunas: ["Namacunde"] },
      { nome: "Ombadja", comunas: ["Ombadja"] },
    ],
  },
  {
    nome: "Huambo",
    municipios: [
      { nome: "Bailundo", comunas: ["Bailundo", "Lunge"] },
      { nome: "Caála", comunas: ["Caála", "Ecunha"] },
      { nome: "Catchiungo", comunas: ["Catchiungo"] },
      { nome: "Chicala-Cholohanga", comunas: ["Chicala-Cholohanga"] },
      { nome: "Chibia", comunas: ["Chibia"] },
      { nome: "Chinjenje", comunas: ["Chinjenje"] },
      { nome: "Huambo", comunas: ["Huambo", "Bailundo", "Catchiungo", "Ecunha", "Lunge", "Mungo"] },
      { nome: "Londuimbali", comunas: ["Londuimbali"] },
      { nome: "Longonjo", comunas: ["Longonjo"] },
      { nome: "Mungo", comunas: ["Mungo"] },
      { nome: "Tchindjenje", comunas: ["Tchindjenje"] },
      { nome: "Ucuma", comunas: ["Ucuma"] },
    ],
  },
  {
    nome: "Huíla",
    municipios: [
      { nome: "Cacula", comunas: ["Cacula"] },
      { nome: "Caconda", comunas: ["Caconda", "Catata"] },
      { nome: "Caluquembe", comunas: ["Caluquembe"] },
      { nome: "Chiange", comunas: ["Chiange"] },
      { nome: "Chibia", comunas: ["Chibia"] },
      { nome: "Chicomba", comunas: ["Chicomba"] },
      { nome: "Chipindo", comunas: ["Chipindo"] },
      { nome: "Cuvango", comunas: ["Cuvango"] },
      { nome: "Gambos", comunas: ["Gambos"] },
      { nome: "Humpata", comunas: ["Humpata"] },
      { nome: "Jamba", comunas: ["Jamba"] },
      { nome: "Lubango", comunas: ["Lubango", "Humpata", "Quilemba", "Chiange"] },
      { nome: "Matala", comunas: ["Matala"] },
      { nome: "Quilengues", comunas: ["Quilengues"] },
    ],
  },
  {
    nome: "Luanda",
    municipios: [
      {
        nome: "Belas",
        comunas: ["Futungo de Belas", "Morro Bento", "Ramiros", "Samba"],
      },
      {
        nome: "Cazenga",
        comunas: ["Cazenga", "Hoji Ya Henda", "Palanca"],
      },
      {
        nome: "Icolo e Bengo",
        comunas: ["Catete", "Icolo", "Cabiri", "Cassoneca"],
      },
      {
        nome: "Kilamba Kiaxi",
        comunas: ["Kilamba Kiaxi", "Boa Vista", "Rocha Pinto"],
      },
      {
        nome: "Luanda",
        comunas: ["Ingombota", "Maianga", "Rangel", "Samba", "Sambizanga"],
      },
      {
        nome: "Quiçama",
        comunas: ["Muxima", "Cabo Ledo", "Quiçama"],
      },
      {
        nome: "Talatona",
        comunas: ["Talatona", "Benfica", "Camama"],
      },
      {
        nome: "Viana",
        comunas: ["Viana", "Calumbo", "Kikuxi"],
      },
    ],
  },
  {
    nome: "Lunda Norte",
    municipios: [
      { nome: "Cambulo", comunas: ["Cambulo"] },
      { nome: "Capenda-Camulemba", comunas: ["Capenda-Camulemba"] },
      { nome: "Caungula", comunas: ["Caungula"] },
      { nome: "Chitato", comunas: ["Chitato"] },
      { nome: "Cuango", comunas: ["Cuango"] },
      { nome: "Cuilo", comunas: ["Cuilo"] },
      { nome: "Lucapa", comunas: ["Lucapa"] },
      { nome: "Lubalo", comunas: ["Lubalo"] },
      { nome: "Xá-Muteba", comunas: ["Xá-Muteba"] },
    ],
  },
  {
    nome: "Lunda Sul",
    municipios: [
      { nome: "Cacolo", comunas: ["Cacolo"] },
      { nome: "Dala", comunas: ["Dala"] },
      { nome: "Muconda", comunas: ["Muconda"] },
      { nome: "Saurimo", comunas: ["Saurimo", "Alto Chicapa"] },
    ],
  },
  {
    nome: "Malanje",
    municipios: [
      { nome: "Cacuso", comunas: ["Cacuso"] },
      { nome: "Caombo", comunas: ["Caombo"] },
      { nome: "Cunda-Dia-Baze", comunas: ["Cunda-Dia-Baze"] },
      { nome: "Kasonge", comunas: ["Kasonge"] },
      { nome: "Luquembo", comunas: ["Luquembo"] },
      { nome: "Malanje", comunas: ["Malanje", "Cacuso"] },
      { nome: "Marimba", comunas: ["Marimba"] },
      { nome: "Massango", comunas: ["Massango"] },
      { nome: "Mucari", comunas: ["Mucari"] },
      { nome: "Quela", comunas: ["Quela"] },
      { nome: "Quirima", comunas: ["Quirima"] },
    ],
  },
  {
    nome: "Moxico",
    municipios: [
      { nome: "Alto Zambeze", comunas: ["Alto Zambeze"] },
      { nome: "Bundas", comunas: ["Bundas"] },
      { nome: "Camanongue", comunas: ["Camanongue"] },
      { nome: "Léua", comunas: ["Léua"] },
      { nome: "Luau", comunas: ["Luau"] },
      { nome: "Luena", comunas: ["Luena", "Camanongue"] },
      { nome: "Lumeje", comunas: ["Lumeje"] },
      { nome: "Moxico", comunas: ["Moxico"] },
    ],
  },
  {
    nome: "Namibe",
    municipios: [
      { nome: "Bibala", comunas: ["Bibala"] },
      { nome: "Camucuio", comunas: ["Camucuio"] },
      { nome: "Moçâmedes", comunas: ["Moçâmedes", "Caraculo"] },
      { nome: "Tômbwa", comunas: ["Tômbwa"] },
      { nome: "Virei", comunas: ["Virei"] },
    ],
  },
  {
    nome: "Uíge",
    municipios: [
      { nome: "Alto Cauale", comunas: ["Alto Cauale"] },
      { nome: "Ambuíla", comunas: ["Ambuíla"] },
      { nome: "Bembe", comunas: ["Bembe"] },
      { nome: "Buengas", comunas: ["Buengas"] },
      { nome: "Bungo", comunas: ["Bungo"] },
      { nome: "Damba", comunas: ["Damba"] },
      { nome: "Macocola", comunas: ["Macocola"] },
      { nome: "Mucaba", comunas: ["Mucaba"] },
      { nome: "Negage", comunas: ["Negage"] },
      { nome: "Puri", comunas: ["Puri"] },
      { nome: "Quimbele", comunas: ["Quimbele"] },
      { nome: "Quitexe", comunas: ["Quitexe"] },
      { nome: "Sanza Pombo", comunas: ["Sanza Pombo"] },
      { nome: "Songo", comunas: ["Songo"] },
      { nome: "Uíge", comunas: ["Uíge", "Maquela do Zombo", "Songo"] },
    ],
  },
  {
    nome: "Zaire",
    municipios: [
      { nome: "Cuimba", comunas: ["Cuimba"] },
      { nome: "M'Banza Kongo", comunas: ["M'Banza Kongo", "Luvo", "Ntandu"] },
      { nome: "Noqui", comunas: ["Noqui"] },
      { nome: "Soyo", comunas: ["Soyo", "Nzeto"] },
      { nome: "Tomboco", comunas: ["Tomboco"] },
    ],
  },
  // ── Novas 3 províncias (Decreto Legislativo Presidencial 2ª séries) ──
  {
    nome: "Icolo e Bengo",
    municipios: [
      { nome: "Cacuaco", comunas: ["Cacuaco", "Funda", "Kikolo"] },
      { nome: "Catete", comunas: ["Catete", "Cabiri", "Cassoneca"] },
    ],
  },
  {
    nome: "Kwanza Norte",
    municipios: [
      { nome: "N'Dalatando", comunas: ["N'Dalatando", "Quicolungo"] },
      { nome: "Lucala", comunas: ["Lucala", "Camabatela"] },
    ],
  },
  {
    nome: "Cuando",
    municipios: [
      { nome: "Luiana", comunas: ["Luiana", "Rivungo"] },
      { nome: "Calai", comunas: ["Calai", "Nancova"] },
    ],
  },
];

// Bairros principais por município (Luanda detalhado, resto genérico)
export const BAIRROS_POR_MUNICIPIO: Record<string, string[]> = {
  // Luanda - Belas
  "Belas": ["Futungo de Belas", "Morro Bento", "Ramiros", "Quilamba", "Mutamba", "Samba"],
  // Luanda - Cazenga
  "Cazenga": ["Cazenga", "Hoji Ya Henda", "Palanca", "Tala Hady", "Lixeira"],
  // Luanda - Kilamba Kiaxi
  "Kilamba Kiaxi": ["Kilamba Kiaxi", "Boa Vista", "Rocha Pinto", "Palanca", "Gamek"],
  // Luanda - Luanda
  "Luanda": ["Ingombota", "Maianga", "Rangel", "Samba", "Sambizanga", "Marginal", "Ilha de Luanda", "Maculusso"],
  // Luanda - Talatona
  "Talatona": ["Talatona", "Benfica", "Camama", "Sequele", "Quilamba", "Golf 2"],
  // Luanda - Viana
  "Viana": ["Viana", "Calumbo", "Kikuxi", "Petrangol", "Mulenvos", "Estalagem"],
  // Benguela - Lobito
  "Lobito": ["Lobito Centro", "Catumbela", "Restinga", "Monte Belo", "Compão"],
  // Benguela - Benguela
  "Benguela": ["Benguela Centro", "Baía Farta", "Dombolo", "Lobito", "Restinga"],
  // Huambo - Huambo
  "Huambo": ["Huambo Centro", "Lajinha", "Terra Nova", "Comandante Bula", "Cacilhas"],
  // Lubango - Huíla
  "Lubango": ["Lubango Centro", "Humpata", "Tundavala", "Bairro Popular", "Gambela"],
};

export function provincias(): string[] {
  const seen = new Set<string>();
  return GEO_ANGOLA.map((p) => p.nome).filter((n) => { if (seen.has(n)) return false; seen.add(n); return true; });
}

export function municipiosByProvincia(provincia: string): string[] {
  return GEO_ANGOLA.find((p) => p.nome === provincia)?.municipios.map((m) => m.nome) ?? [];
}

export function comunasByMunicipio(provincia: string, municipio: string): string[] {
  return (
    GEO_ANGOLA.find((p) => p.nome === provincia)
      ?.municipios.find((m) => m.nome === municipio)
      ?.comunas ?? []
  );
}

export function bairrosByMunicipio(municipio: string): string[] {
  return BAIRROS_POR_MUNICIPIO[municipio] ?? [];
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
