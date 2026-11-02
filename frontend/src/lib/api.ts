import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = "kubico_access";
const REFRESH_KEY = "kubico_refresh";

export const tokenStorage = {
  getAccess: () =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  getRefresh: () =>
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,
  set: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ── Request interceptor — attach bearer ───────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — refresh on 401 ────────────────────────────────────
let refreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const refresh = tokenStorage.getRefresh();
    if (!refresh) {
      tokenStorage.clear();
      window.location.href = "/auth/login";
      return Promise.reject(error);
    }

    if (refreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    refreshing = true;
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, null, {
        params: { token: refresh },
      });
      tokenStorage.set(data.access_token, data.refresh_token);
      queue.forEach((cb) => cb(data.access_token));
      queue = [];
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return api(original);
    } catch {
      tokenStorage.clear();
      window.location.href = "/auth/login";
      return Promise.reject(error);
    } finally {
      refreshing = false;
    }
  }
);

// ── Auth endpoints ─────────────────────────────────────────────────────────────
export const authApi = {
  /**
   * Cria conta. O backend espera { nome, email, senha, telefone? }
   * e devolve Token { access_token, refresh_token }.
   */
  register: (data: {
    nome: string;
    email: string;
    senha: string;           // ← backend usa "senha", não "password"
    telefone?: string;
  }) => api.post("/auth/register", data),

  /**
   * Faz login. O backend espera JSON { email, senha }.
   */
  login: (data: { email: string; senha: string }) =>
    api.post("/auth/login", data),

  me: () => api.get("/auth/me"),
};

// ── Property endpoints ────────────────────────────────────────────────────────
export const propertyApi = {
  search: (params: Record<string, unknown>) =>
    api.get("/properties/", { params }),

  get: (id: string) => api.get(`/properties/${id}`),

  create: (data: unknown) => api.post("/properties/", data),

  update: (id: string, data: unknown) => api.patch(`/properties/${id}`, data),

  delete: (id: string) => api.delete(`/properties/${id}`),

  mine: () => api.get("/properties/me"),

  analytics: (id: string) => api.get(`/properties/${id}/analytics`),

  whatsappLink: (id: string) => api.get(`/properties/${id}/whatsapp-link`),

  interest: (data: unknown) => api.post("/leads/interesse", data),
};

// ── Favorites ─────────────────────────────────────────────────────────────────
export const favoritesApi = {
  toggle: (id: string) => api.post(`/favorites/${id}/toggle`),
  list: () => api.get("/favorites/"),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentApi = {
  destaque: (imovel_id: string, dias: 7 | 15 | 30) =>
    api.post("/payments/destaque", { imovel_id, dias }),
  planoAgente: () => api.post("/payments/plano-agente"),
  myPayments: () => api.get("/payments/my"),
};

// ── Uploads ───────────────────────────────────────────────────────────────────
export const uploadApi = {
  image: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/uploads/image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  video: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/uploads/video", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  profilePhoto: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/uploads/profile-photo", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userApi = {
  me: () => api.get("/users/me"),
  update: (data: unknown) => api.put("/users/me", data),
};

// ── Verification ──────────────────────────────────────────────────────────────
export const verificationApi = {
  requestCode: (canal: "email" | "telefone", destino: string) =>
    api.post("/verification/request-code", { canal, destino }),
  verifyCode: (canal: "email" | "telefone", destino: string, codigo: string) =>
    api.post("/verification/verify-code", { canal, destino, codigo }),
};
