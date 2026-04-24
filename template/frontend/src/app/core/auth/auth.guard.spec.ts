import { describe, expect, it } from 'vitest';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('should be a function', () => {
    expect(typeof authGuard).toBe('function');
  });
});

