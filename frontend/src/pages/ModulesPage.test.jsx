import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModulesPage from './ModulesPage';
import * as client from '../api/client';

vi.mock('../api/client');

vi.mock('../context/ProgressContext', () => ({
  useProgress: () => ({
    completedLessonIds: new Set(),
    progressLoading: false,
    markComplete: vi.fn(),
    markIncomplete: vi.fn(),
  }),
}));

const renderPage = () => render(<MemoryRouter><ModulesPage /></MemoryRouter>);

const paginatedResponse = (results) => ({
  data: { count: results.length, next: null, previous: null, results },
});

describe('ModulesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getTags.mockResolvedValue({ data: [] });
  });

  it('shows loading state before data arrives', () => {
    client.getModules.mockReturnValue(new Promise(() => {}));
    renderPage();
    // Skeletons render instead of text — page does not crash
    expect(screen.getByText('Learning Modules')).toBeInTheDocument();
  });

  it('renders module titles from a paginated response', async () => {
    client.getModules.mockResolvedValue(paginatedResponse([
      { id: 1, title: 'Python Basics', slug: 'python', description: 'Learn Python', lessons: [] },
      { id: 2, title: 'JavaScript', slug: 'js', description: 'Learn JS', lessons: [] },
    ]));
    renderPage();
    await waitFor(() => expect(screen.getByText('Python Basics')).toBeInTheDocument());
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('shows empty state when no modules are returned', async () => {
    client.getModules.mockResolvedValue(paginatedResponse([]));
    renderPage();
    await waitFor(() => expect(screen.getByText('No modules available.')).toBeInTheDocument());
  });

  it('shows error message on API failure', async () => {
    client.getModules.mockRejectedValue({ userMessage: 'Network error. Please check your connection.' });
    renderPage();
    await waitFor(() => expect(screen.getByText(/Network error/)).toBeInTheDocument());
  });

  it('shows generic error when userMessage is absent', async () => {
    client.getModules.mockRejectedValue({});
    renderPage();
    await waitFor(() => expect(screen.getByText(/Failed to load modules/)).toBeInTheDocument());
  });

  it('calls getModules once on mount', async () => {
    client.getModules.mockResolvedValue(paginatedResponse([]));
    renderPage();
    await waitFor(() => expect(client.getModules).toHaveBeenCalledOnce());
  });

  it('shows progress fraction on module card when lessons exist', async () => {
    client.getModules.mockResolvedValue(paginatedResponse([
      { id: 1, title: 'Python Basics', slug: 'python', description: '', lessons: [{ id: 1 }, { id: 2 }] },
    ]));
    renderPage();
    await waitFor(() => expect(screen.getByText('0/2 completed')).toBeInTheDocument());
  });
});
