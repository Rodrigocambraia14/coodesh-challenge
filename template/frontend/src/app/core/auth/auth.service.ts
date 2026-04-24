import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { AuthStorage, type AuthSession } from './auth.storage';

type ApiResponseWithData<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

type AuthenticateUserRequest = {
  email: string;
  password: string;
};

type AuthenticateUserResponse = {
  userId: string;
  token: string;
  email: string;
  name: string;
  role: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSig = signal<AuthSession | null>(AuthStorage.read());

  readonly session = computed(() => this.sessionSig());
  readonly isAuthenticated = computed(() => !!this.sessionSig()?.token);
  readonly isCustomer = computed(() => this.sessionSig()?.role === 'Customer');
  readonly isAdminOrManager = computed(() => {
    const r = this.sessionSig()?.role;
    return r === 'Admin' || r === 'Manager';
  });

  constructor(private readonly http: HttpClient) {}

  login(request: AuthenticateUserRequest) {
    return this.http
      .post<ApiResponseWithData<AuthenticateUserResponse>>('/api/Auth', request)
      .pipe(
        map((res) => {
          const d = res?.data;
          if (!d?.token || !d.userId) throw new Error('Invalid auth response');
          const session: AuthSession = {
            token: d.token,
            userId: d.userId,
            email: d.email,
            name: d.name,
            role: d.role
          };
          this.setSession(session);
          return session;
        })
      );
  }

  setSession(session: AuthSession | null) {
    if (session) AuthStorage.write(session);
    else AuthStorage.clear();
    this.sessionSig.set(session);
  }

  logout() {
    AuthStorage.clear();
    this.sessionSig.set(null);
  }
}

