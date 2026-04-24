import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthStorage } from './auth.storage';
import { AuthService } from './auth.service';
import { of } from 'rxjs';

class FakeHttpClient {
  post = vi.fn();
}

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('login should store session', () => {
    const http = new FakeHttpClient();
    http.post.mockReturnValue(
      of({
        success: true,
        data: { userId: '00000000-0000-0000-0000-000000000099', token: 't', email: 'a@b.com', name: 'A', role: 'Admin' }
      })
    );

    const service = new AuthService(http as any);
    service.login({ email: 'a@b.com', password: 'x' }).subscribe();

    const stored = AuthStorage.read();
    expect(stored?.token).toBe('t');
    expect(service.isAuthenticated()).toBe(true);
  });
});

