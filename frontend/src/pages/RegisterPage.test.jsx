import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterPage from './RegisterPage';
import * as client from '../api/client';
import { useAuth } from '../context/AuthContext';

vi.mock('../api/client');
vi.mock('../context/AuthContext');

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderPage = () => render(<MemoryRouter><RegisterPage /></MemoryRouter>);

const fillForm = async ({ username = 'alice', email = 'alice@example.com', password = 'StrongPass123!', password2 = 'StrongPass123!' } = {}) => {
  await userEvent.type(screen.getByLabelText('Username'), username);
  await userEvent.type(screen.getByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.type(screen.getByLabelText('Confirm Password'), password2);
};

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: null, login: vi.fn(), logout: vi.fn() });
  });

  it('renders all form fields and submit button', () => {
    renderPage();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('registers, auto-logs in, and navigates to home', async () => {
    const login = vi.fn();
    useAuth.mockReturnValue({ user: null, login, logout: vi.fn() });
    client.registerUser.mockResolvedValue({ data: {} });
    client.loginUser.mockResolvedValue({ data: { access: 'access-tok', refresh: 'refresh-tok' } });
    client.getMe.mockResolvedValue({ data: { id: 1, username: 'alice' } });

    renderPage();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(client.registerUser).toHaveBeenCalledOnce();
      expect(login).toHaveBeenCalledWith('access-tok', 'refresh-tok', { id: 1, username: 'alice' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows per-field errors returned from the API', async () => {
    client.registerUser.mockRejectedValue({
      response: {
        data: {
          username: ['A user with that username already exists.'],
          password: ['This password is too common.'],
        },
      },
    });

    renderPage();
    await fillForm({ username: 'existing' });
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('A user with that username already exists.')).toBeInTheDocument();
      expect(screen.getByText('This password is too common.')).toBeInTheDocument();
    });
  });

  it('shows a general error when the API returns a non-object error', async () => {
    client.registerUser.mockRejectedValue({ userMessage: 'Server error. Please try again later.' });

    renderPage();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
    });
  });

  it('disables button while submitting', async () => {
    client.registerUser.mockReturnValue(new Promise(() => {}));

    renderPage();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
  });

  it('redirects to home if already logged in', () => {
    useAuth.mockReturnValue({ user: { username: 'alice' }, login: vi.fn(), logout: vi.fn() });
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
