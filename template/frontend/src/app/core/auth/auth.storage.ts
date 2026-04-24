export type AuthSession = {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: string;
};

const STORAGE_KEY = 'auth.session.v1';

export class AuthStorage {
  static read(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as AuthSession;
      if (!s?.token || !s.userId) return null;
      return s;
    } catch {
      return null;
    }
  }

  static write(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

