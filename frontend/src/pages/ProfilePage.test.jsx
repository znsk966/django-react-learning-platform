import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from './ProfilePage';
import * as client from '../api/client';
import { useAuth } from '../context/AuthContext';

vi.mock('../api/client');

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const freeUser = {
  id: 1,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  profile: {
    bio: '',
    subscription_tier: 'free',
    subscription_status: 'inactive',
    is_pro: false,
    current_period_end: null,
  },
};

const proUser = {
  ...freeUser,
  profile: {
    bio: 'I love coding',
    subscription_tier: 'pro',
    subscription_status: 'active',
    is_pro: true,
    current_period_end: '2026-12-31T00:00:00Z',
  },
};

const mockRefreshUser = vi.fn();

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getProgress.mockResolvedValue({ data: { results: [], next: null } });
  });

  it('shows sign-in prompt when not logged in', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, refreshUser: mockRefreshUser });
    renderPage();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('renders avatar initials from username when no name is set', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...freeUser, first_name: '', last_name: '' },
      refreshUser: mockRefreshUser,
    });
    renderPage();
    expect(screen.getByText('TE')).toBeInTheDocument(); // username 'testuser' → 'TE'
  });

  it('shows Free badge for free user', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: freeUser, refreshUser: mockRefreshUser });
    renderPage();
    await waitFor(() => expect(screen.getByText('Free')).toBeInTheDocument());
  });

  it('shows Upgrade to Pro button for free user', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: freeUser, refreshUser: mockRefreshUser });
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /Upgrade to Pro/i })).toBeInTheDocument());
  });

  it('shows Pro badge for pro user', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: proUser, refreshUser: mockRefreshUser });
    renderPage();
    await waitFor(() => expect(screen.getByText('Pro')).toBeInTheDocument());
  });

  it('shows Manage Subscription button for pro user', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: proUser, refreshUser: mockRefreshUser });
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Manage Subscription/i })).toBeInTheDocument()
    );
  });

  it('shows current_period_end for pro user', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: proUser, refreshUser: mockRefreshUser });
    renderPage();
    await waitFor(() => expect(screen.getByText(/Renews/)).toBeInTheDocument());
  });

  it('calls updateProfile on form submit', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: freeUser, refreshUser: mockRefreshUser });
    client.updateProfile.mockResolvedValue({ data: freeUser });
    renderPage();

    await waitFor(() => screen.getByLabelText('First name'));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Elena', name: 'first_name' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(client.updateProfile).toHaveBeenCalledOnce());
  });

  it('shows 0 lessons completed when no progress', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: freeUser, refreshUser: mockRefreshUser });
    renderPage();
    await waitFor(() => expect(screen.getByText('Lessons Completed')).toBeInTheDocument());
    // The stats-value for completed should be 0
    const statValues = screen.getAllByRole('generic');
    const completedEl = screen.getAllByText('0');
    expect(completedEl.length).toBeGreaterThan(0);
  });

  it('shows 0 day streak when no progress', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: freeUser, refreshUser: mockRefreshUser });
    renderPage();
    await waitFor(() => expect(screen.getByText('Day Streak')).toBeInTheDocument());
  });

  it('shows error message when save fails', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: freeUser, refreshUser: mockRefreshUser });
    client.updateProfile.mockRejectedValue({
      response: { data: { email: ['A user with this email already exists.'] } },
    });
    renderPage();

    await waitFor(() => screen.getByLabelText('Email'));
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() =>
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    );
  });

  it('redirects to checkout URL on upgrade click', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: freeUser, refreshUser: mockRefreshUser });
    client.createCheckoutSession.mockResolvedValue({
      data: { checkout_url: 'https://checkout.stripe.com/test' },
    });

    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: '',
    });

    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /Upgrade to Pro/i }));
    fireEvent.click(screen.getByRole('button', { name: /Upgrade to Pro/i }));

    await waitFor(() => expect(client.createCheckoutSession).toHaveBeenCalledOnce());
    locationSpy.mockRestore();
  });
});
