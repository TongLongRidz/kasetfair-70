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
  key: string;
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
  is_superadmin?: boolean;
  role_id?: number;
  role?: RoleItem;
  created_at: string;
  updated_at: string;
}

const TOKEN_KEY = "kaset_token";
const USER_KEY = "kaset_user";

// Memory store & fast sessionStorage cache for admin user state (instant 0ms render on reloads)
let memoryUser: AdminUser | null = null;

export function getStoredToken(): string | null {
  // Token is stored in HttpOnly cookie sent automatically with credentials/requests
  return getCookieToken();
}

export function getStoredUser(): AdminUser | null {
  if (memoryUser) return memoryUser;
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(USER_KEY);
      if (cached) {
        memoryUser = JSON.parse(cached);
        return memoryUser;
      }
    } catch {}
  }
  return null;
}

export function setStoredUser(user: AdminUser | null): void {
  memoryUser = user;
  if (typeof window !== "undefined") {
    try {
      if (user) {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(USER_KEY);
      }
    } catch {}
  }
}

export function setAuthSession(token: string, user: AdminUser): void {
  setStoredUser(user);
  if (typeof window === "undefined") return;
  // Clean up any legacy localStorage entries
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Also set cookie fallback for client side if needed
  document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export async function clearAuthSession(): Promise<void> {
  memoryUser = null;
  if (typeof window === "undefined") return;

  // Clear localStorage & sessionStorage
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.clear();
  } catch {}

  // Expire all accessible document cookies
  try {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; domain=${window.location.hostname}; SameSite=Lax`;
      }
    }
  } catch {}

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8585";
    await fetch(`${apiUrl}/api/v1/auth/logout`, { method: "POST", credentials: "include" });
  } catch {}
}

export function isAuthenticated(): boolean {
  return !!memoryUser || !!getCookieToken();
}

export function isSuperAdmin(user?: AdminUser | null): boolean {
  const targetUser = user || memoryUser;
  return targetUser?.role?.key === "super_admin" || targetUser?.role?.key === "admin";
}

/**
 * Route path to required view permission mapping
 */
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/staff/management/dashboard": "dashboard.view",
  "/staff/management/expense": "expense.view",
  "/staff/management/slip-check": "slip_check.view",
  "/staff/management/menu": "menu.view",
  "/staff/management/toppings": "topping.view",
  "/staff/management/banner": "banner.view",
  "/staff/management/roles": "permission.view",
  "/staff/management/permissions": "permission.view",
  "/staff/management/account": "staff.view",
  "/staff/pos/front-desk": "pos_front.view",
  "/staff/pos/kitchen": "kitchen.view",
  "/staff/pos/queue": "queue.view",
};

/**
 * Check if the staff member has a specific permission
 */
export function hasPermission(permissionName: string, user?: AdminUser | null): boolean {
  const targetUser = user || memoryUser;
  if (!targetUser) return false;
  if (isSuperAdmin(targetUser)) return true;

  const permissions = targetUser.role?.permissions || [];
  return permissions.some((p) => p.name === permissionName);
}

/**
 * Check if the staff member has view permission for a specific route path
 */
export function canAccessPath(path: string, user?: AdminUser | null): boolean {
  const targetUser = user || memoryUser;
  if (!targetUser) return false;
  if (isSuperAdmin(targetUser)) return true;

  // Find matching route prefix
  for (const [routePath, perm] of Object.entries(ROUTE_PERMISSIONS)) {
    if (path === routePath || path.startsWith(routePath + "/")) {
      return hasPermission(perm, targetUser);
    }
  }

  // If route is not explicitly restricted in ROUTE_PERMISSIONS (e.g. general staff pages)
  return true;
}

/**
 * Get first allowed landing path for a staff member based on permissions
 */
export function getFirstAllowedPath(user?: AdminUser | null): string {
  const targetUser = user || memoryUser;
  if (!targetUser) return "/staff/login";
  if (isSuperAdmin(targetUser)) return "/staff/management/dashboard";

  const priorityPaths = [
    "/staff/management/dashboard",
    "/staff/management/slip-check",
    "/staff/management/expense",
    "/staff/management/menu",
    "/staff/management/toppings",
    "/staff/management/banner",
    "/staff/management/roles",
    "/staff/management/permissions",
    "/staff/management/account",
    "/staff/pos/front-desk",
    "/staff/pos/kitchen",
    "/staff/pos/queue",
  ];

  for (const path of priorityPaths) {
    if (canAccessPath(path, targetUser)) {
      return path;
    }
  }

  return "/staff/pos/front-desk";
}

function getCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )token=([^;]+)"));
  return match && match[2] ? match[2] : null;
}
