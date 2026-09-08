export interface AdminUser {
  id: number;
  uuid: string;
  username: string;
  name: string;
  is_activate: boolean;
  is_superadmin: boolean;
  created_at: string;
  updated_at: string;
}

const TOKEN_KEY = "kaset_admin_token";
const USER_KEY = "kaset_admin_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || getCookieToken();
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AdminUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `admin_token=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "admin_token=; path=/; max-age=0; SameSite=Lax";
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export function isSuperAdmin(): boolean {
  const user = getStoredUser();
  return !!user?.is_superadmin;
}

function getCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )admin_token=([^;]+)"));
  return match && match[2] ? match[2] : null;
}
