import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';
import * as client from '../api/client';
import { useAuth } from '../context/AuthContext';

vi.mock('../api/client');
vi.mock('../context/AuthContext');

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderPage = () => render(<MemoryRouter><LoginPage /></MemoryRouter>);

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null, login: vi.fn(), logout: vi.fn() });
  });

  it('renders username, password fields and submit button', () => {
    renderPage();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders link to register page', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Create one' })).toBeInTheDocument();
  });

  it('logs in successfully and navigates to home', async () => {
    const login = vi.fn();
    useAuth.mockReturnValue({ user: null, login, logout: vi.fn() });
    client.loginUser.mockResolvedValue({ data: { access: 'access-tok', refresh: 'refresh-tok' } });
    client.getMe.mockResolvedValue({ data: { id: 1, username: 'alice' } });

    renderPage();
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'StrongPass123!');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('access-tok', 'refresh-tok', { id: 1, username: 'alice' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('calls loginUser with the entered credentials', async () => {
    client.loginUser.mockResolvedValue({ data: { access: 'tok', refresh: 'ref' } });
    client.getMe.mockResolvedValue({ data: { id: 1, username: 'alice' } });

    renderPage();
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'mypassword');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(client.loginUser).toHaveBeenCalledWith({ username: 'alice', password: 'mypassword' });
    });
  });

  it('shows error message on failed login', async () => {
    client.loginUser.mockRejectedValue({ userMessage: 'Invalid username or password.' });

    renderPage();
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid username or password.')).toBeInTheDocument();
    });
  });

  it('shows generic error when userMessage is absent', async () => {
    client.loginUser.mockRejectedValue({});

    renderPage();
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid username or password.')).toBeInTheDocument();
    });
  });

  it('disables button and shows loading text while submitting', async () => {
    client.loginUser.mockReturnValue(new Promise(() => {})); // never resolves

    renderPage();
    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Password'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    const btn = screen.getByRole('button', { name: 'Signing in...' });
    expect(btn).toBeDisabled();
  });

  it('redirects to home if already logged in', () => {
    useAuth.mockReturnValue({ user: { username: 'alice' }, login: vi.fn(), logout: vi.fn() });
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
