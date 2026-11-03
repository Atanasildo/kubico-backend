// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export type UserRole = "particular" | "agente" | "admin";

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: UserRole;
  provincia?: string;
  municipio?: string;
  foto_perfil_url?: string;
  bio?: string;
  nome_empresa?: string;
  email_verificado: boolean;
  telefone_verificado: boolean;
  plano_agente_expira_em?: string;
  ativo: boolean;
  criado_em: string;
}

export interface UserPublic {
  id: string;
  nome: string;
  role: UserRole;
  foto_perfil_url?: string;
  nome_empresa?: string;
  telefone_verificado: boolean;
}

// ── Properties ────────────────────────────────────────────────────────────────
export type TipoNegocio = "arrendamento" | "venda";
export type TipoImovel =
  | "apartamento"
  | "casa"
  | "terreno"
  | "loja"
  | "escritorio"
  | "armazem"
  | "quarto"
  | "outro";
export type PropertyStatus = "ativo" | "arrendado" | "vendido" | "suspenso";

export interface PropertyListItem {
  id: string;
  titulo: string;
  tipo_negocio: TipoNegocio;
  tipo_imovel: TipoImovel;
  preco: string;
  moeda: string;
  provincia: string;
  municipio: string;
  bairro?: string;
  area_m2?: string;
  quartos?: number;
  casas_banho?: number;
  imagens?: string[];
  status: PropertyStatus;
  verificado: boolean;
  destaque_ate?: string;
  criado_em: string;
}

export type PisoTipo = "mosaico" | "cimento" | "madeira" | "outro";

export interface Property extends PropertyListItem {
  descricao?: string;
  endereco_referencia?: string;
  latitude?: string;
  longitude?: string;
  andares?: number;
  // Contadores
  cozinhas:    number;
  salas:       number;
  varandas:    number;
  despensas:   number;
  garagens:    number;
  // Utilities
  tem_energia:       boolean;
  tem_agua:          boolean;
  tem_gerador:       boolean;
  tem_fossa_septica: boolean;
  // Acabamentos
  piso_tipo:     PisoTipo;
  mobilado:      boolean;
  tem_wc_servico:boolean;
  tem_piscina:   boolean;
  tem_seguranca: boolean;
  tem_elevador:  boolean;
  tem_quintal:   boolean;
  // Meta
  videos?: string[];
  contacto_telefone?: string;
  contacto_whatsapp?: string;
  aprovado: boolean;
  flagged: boolean;
  visualizacoes: number;
  autor_id: string;
  autor?: UserPublic;
  em_destaque: boolean;
}

export interface PropertySearchParams {
  tipo_negocio?: TipoNegocio;
  tipo_imovel?: TipoImovel;
  provincia?: string;
  municipio?: string;
  bairro?: string;
  preco_min?: number;
  preco_max?: number;
  quartos_min?: number;
  moeda?: string;
  page?: number;
  limit?: number;
}

// ── Payments ──────────────────────────────────────────────────────────────────
export type PaymentTipo = "destaque" | "plano_agente" | "verificacao";
export type PaymentStatus = "pendente" | "pago" | "falhado" | "reembolsado";

export interface Payment {
  id: string;
  tipo: PaymentTipo;
  valor: string;
  status: PaymentStatus;
  entidade?: string;
  referencia?: string;
  validade?: string;
  dias_destaque?: number;
  criado_em: string;
  pago_em?: string;
}

// ── Interactions ──────────────────────────────────────────────────────────────
export interface Favorite {
  id: string;
  imovel: PropertyListItem;
  criado_em: string;
}

export type LeadCanal = "whatsapp" | "telefone" | "chat_interno";

export interface LeadCreate {
  imovel_id: string;
  canal: LeadCanal;
  nome_interessado?: string;
  contacto_interessado?: string;
  mensagem?: string;
}

// ── API pagination ─────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
