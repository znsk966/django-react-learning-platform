import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';
import * as client from '../api/client';
import { useAuth } from '../context/AuthContext';

vi.mock('../api/client');

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null, authLoading: false })),
}));

vi.mock('../context/ProgressContext', () => ({
  useProgress: () => ({
    completedLessonIds: new Set(),
    progressLoading: false,
    markComplete: vi.fn(),
    markIncomplete: vi.fn(),
  }),
}));

// Recharts uses SVG which jsdom doesn't fully support
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
}));

const paginatedResponse = (results) => ({
  data: { count: results.length, next: null, previous: null, results },
});

const renderPage = () => render(<MemoryRouter><Dashboard /></MemoryRouter>);

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null, authLoading: false });
  });

  it('shows loading state before data arrives', () => {
    client.getModules.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders total modules count', async () => {
    client.getModules.mockResolvedValue(paginatedResponse([
      { id: 1, title: 'Module A', lessons: [{ id: 1 }, { id: 2 }] },
      { id: 2, title: 'Module B', lessons: [{ id: 3 }] },
    ]));
    renderPage();
    await waitFor(() => expect(screen.getByText('Total Modules')).toBeInTheDocument());
    const statValues = screen.getAllByRole('paragraph');
    const texts = statValues.map(el => el.textContent);
    expect(texts).toContain('2'); // total modules
    expect(texts).toContain('3'); // total lessons
  });

  it('renders average lessons per module', async () => {
    client.getModules.mockResolvedValue(paginatedResponse([
      { id: 1, title: 'Module A', lessons: [{ id: 1 }, { id: 2 }, { id: 3 }] },
      { id: 2, title: 'Module B', lessons: [{ id: 4 }, { id: 5 }, { id: 6 }] },
    ]));
    renderPage();
    await waitFor(() => expect(screen.getByText('Average Lessons per Module')).toBeInTheDocument());
    expect(screen.getByText('3.0')).toBeInTheDocument();
  });

  it('renders charts when modules are present', async () => {
    client.getModules.mockResolvedValue(paginatedResponse([
      { id: 1, title: 'Module A', lessons: [{ id: 1 }] },
    ]));
    renderPage();
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('shows empty state when no modules are returned', async () => {
    client.getModules.mockResolvedValue(paginatedResponse([]));
    renderPage();
    await waitFor(() => expect(screen.getByText('No data available to display.')).toBeInTheDocument());
  });

  it('does not render charts when there are no modules', async () => {
    client.getModules.mockResolvedValue(paginatedResponse([]));
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument());
  });

  it('shows error message on API failure', async () => {
    client.getModules.mockRejectedValue({ userMessage: 'Server error. Please try again later.' });
    renderPage();
    await waitFor(() => expect(screen.getByText(/Server error/)).toBeInTheDocument());
  });

  it('shows sign-in prompt for unauthenticated users', async () => {
    client.getModules.mockResolvedValue(paginatedResponse([
      { id: 1, title: 'Module A', lessons: [{ id: 1 }] },
    ]));
    renderPage();
    await waitFor(() => expect(screen.getByText(/Sign in to track your progress/)).toBeInTheDocument());
  });

  it('shows progress stats for logged-in users', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { username: 'testuser' }, authLoading: false });
    client.getModules.mockResolvedValue(paginatedResponse([
      { id: 1, title: 'Module A', lessons: [{ id: 1 }, { id: 2 }] },
    ]));
    renderPage();
    await waitFor(() => expect(screen.getByText('Lessons Completed')).toBeInTheDocument());
    expect(screen.getByText('Overall Completion')).toBeInTheDocument();
    expect(screen.getByText('Modules Finished')).toBeInTheDocument();
  });
});
