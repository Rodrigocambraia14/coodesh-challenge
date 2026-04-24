import { describe, expect, it } from 'vitest';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('should be a function', () => {
    expect(typeof authInterceptor).toBe('function');
  });
});

