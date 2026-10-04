export interface PermissionItem {
  id: number;
  name: string;
  name_th?: string;
  name_en?: string;
  description?: string;
  created_at?: string;
}

export interface RoleItem {
  id: number;
  name: string;
  name_th?: string;
  name_en?: string;
  description?: string;
  created_at?: string;
  permissions?: PermissionItem[];
}

export interface AdminUser {
  id: number;
  uuid: string;
  username: string;
  name: string;
  is_activate: boolean;
  is_superadmin: boolean;
  role_id?: number;
  role?: RoleItem;
  created_at: string;
  updated_at: string;
}

const TOKEN_KEY = "kaset_admin_token";
const USER_KEY = "kaset_admin_user";

// Memory store for admin user state (not stored in localStorage for XSS protection)
let memoryUser: AdminUser | null = null;

export function getStoredToken(): string | null {
  // Token is stored in HttpOnly cookie sent automatically with credentials/requests
  return getCookieToken();
}

export function getStoredUser(): AdminUser | null {
  return memoryUser;
}

export function setStoredUser(user: AdminUser | null): void {
  memoryUser = user;
}

export function setAuthSession(token: string, user: AdminUser): void {
  memoryUser = user;
  if (typeof window === "undefined") return;
  // Clean up any legacy localStorage entries
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Also set cookie fallback for client side if needed
  document.cookie = `admin_token=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export async function clearAuthSession(): Promise<void> {
  memoryUser = null;
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "admin_token=; path=/; max-age=0; SameSite=Lax";
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
    await fetch(`${apiUrl}/api/v1/auth/logout`, { method: "POST", credentials: "include" });
  } catch {}
}

export function isAuthenticated(): boolean {
  return !!memoryUser || !!getCookieToken();
}

export function isSuperAdmin(): boolean {
  return !!memoryUser?.is_superadmin;
}

function getCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )admin_token=([^;]+)"));
  return match && match[2] ? match[2] : null;
}
