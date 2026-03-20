import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import * as client from '../api/client';

vi.mock('../api/client');

const wrapper = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts unauthenticated when no token in localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('fetches user on mount when a valid token is stored', async () => {
    localStorage.setItem('access_token', 'valid-token');
    client.getMe.mockResolvedValue({ data: { id: 1, username: 'alice', email: 'alice@example.com' } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.authLoading).toBe(false));
    expect(client.getMe).toHaveBeenCalledOnce();
    expect(result.current.user).toEqual({ id: 1, username: 'alice', email: 'alice@example.com' });
  });

  it('clears token and stays unauthenticated when getMe fails', async () => {
    localStorage.setItem('access_token', 'expired-token');
    client.getMe.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.authLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('login() stores tokens in localStorage and sets user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.authLoading).toBe(false));

    act(() => {
      result.current.login('access123', 'refresh456', { id: 2, username: 'bob' });
    });

    expect(localStorage.getItem('access_token')).toBe('access123');
    expect(localStorage.getItem('refresh_token')).toBe('refresh456');
    expect(result.current.user).toEqual({ id: 2, username: 'bob' });
  });

  it('logout() clears tokens and sets user to null', async () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('refresh_token', 'refresh');
    client.getMe.mockResolvedValue({ data: { id: 1, username: 'alice' } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());

    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
