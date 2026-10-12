const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
  };
}

export function setTokens(tokens: TokenPair) {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const tokens: TokenPair = await res.json();
  setTokens(tokens);
  return tokens.access_token;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { access } = getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (access) headers.Authorization = `Bearer ${access}`;

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && access) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const authApi = {
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    apiFetch<User>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    apiFetch<TokenPair>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => {
    const { refresh } = getTokens();
    if (refresh) {
      return apiFetch<void>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refresh }),
      });
    }
    return Promise.resolve();
  },
};

export const profileApi = {
  get: () => apiFetch<Record<string, unknown> | null>("/profiles/me"),
  sync: (data: { codeforces_handle?: string; leetcode_username?: string }) =>
    apiFetch<Record<string, unknown>>("/profiles/sync", { method: "POST", body: JSON.stringify(data) }),
};

export const analyticsApi = {
  dashboard: () => apiFetch<Record<string, unknown>>("/analytics/dashboard"),
};

export const roadmapApi = {
  generate: (data: { duration_weeks: number; target_rating: number }) =>
    apiFetch<Record<string, unknown>>("/roadmaps/generate", { method: "POST", body: JSON.stringify(data) }),
  list: () => apiFetch<Record<string, unknown>[]>("/roadmaps"),
};

export const tutorApi = {
  createSession: (title: string) =>
    apiFetch<Record<string, unknown>>("/tutor/sessions", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  listSessions: () => apiFetch<Record<string, unknown>[]>("/tutor/sessions"),
  getSession: (id: string) => apiFetch<Record<string, unknown>>(`/tutor/sessions/${id}`),
  sendMessage: (sessionId: string, content: string) =>
    apiFetch<Record<string, unknown>>(`/tutor/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};

export const codeReviewApi = {
  review: (data: { source_code: string; language: string; problem_title?: string }) =>
    apiFetch<Record<string, unknown>>("/code-review", { method: "POST", body: JSON.stringify(data) }),
  history: () => apiFetch<Record<string, unknown>[]>("/code-review/history"),
};

export const predictionsApi = {
  ratings: () => apiFetch<Record<string, unknown>>("/predictions/ratings"),
  interview: () => apiFetch<Record<string, unknown>>("/predictions/interview-readiness"),
  recommendations: () => apiFetch<Record<string, unknown>>("/predictions/recommendations"),
};
