import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NavBar from './NavBar';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext');

const renderNavBar = () =>
  render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>
  );

describe('NavBar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows Sign In and Register links when logged out', () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    renderNavBar();
    expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('does not show Sign Out button when logged out', () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    renderNavBar();
    expect(screen.queryByRole('button', { name: 'Sign Out' })).not.toBeInTheDocument();
  });

  it('shows username and Sign Out button when logged in', () => {
    useAuth.mockReturnValue({ user: { username: 'alice' }, logout: vi.fn() });
    renderNavBar();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('does not show Sign In or Register when logged in', () => {
    useAuth.mockReturnValue({ user: { username: 'alice' }, logout: vi.fn() });
    renderNavBar();
    expect(screen.queryByRole('link', { name: 'Sign In' })).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('calls logout() when Sign Out is clicked', async () => {
    const logout = vi.fn();
    useAuth.mockReturnValue({ user: { username: 'alice' }, logout });
    renderNavBar();
    await userEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('renders the brand link', () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    renderNavBar();
    expect(screen.getByText(/LearnHub/)).toBeInTheDocument();
  });
});
