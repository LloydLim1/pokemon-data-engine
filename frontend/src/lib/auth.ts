'use client';

export interface AuthUser {
  id: string;
  username: string;
  access_token: string;
}

const KEY = 'pk_auth';

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

export function storeUser(user: AuthUser): void {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(KEY);
}

export function getAuthHeader(): Record<string, string> {
  const user = getStoredUser();
  return user ? { Authorization: `Bearer ${user.access_token}` } : {};
}
