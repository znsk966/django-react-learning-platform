import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonPage from './LessonPage';
import * as client from '../api/client';
import { useAuth } from '../context/AuthContext';

vi.mock('../api/client');

vi.mock('../components/MarkdownRenderer', () => ({
  default: ({ content }) => <div data-testid="markdown-content">{content}</div>,
}));

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

vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const defaultModule = { data: { id: 1, title: 'Python Basics', description: '', lessons: [] } };

const renderWithRoute = (id = '1', search = '') =>
  render(
    <MemoryRouter initialEntries={[`/lesson/${id}${search}`]}>
      <Routes>
        <Route path="/lesson/:id" element={<LessonPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('LessonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null, authLoading: false });
    client.getModuleById.mockResolvedValue(defaultModule);
  });

  it('shows loading state before data arrives', () => {
    client.getLessonById.mockReturnValue(new Promise(() => {}));
    renderWithRoute();
    expect(screen.getByText('Loading lesson...')).toBeInTheDocument();
  });

  it('renders lesson title', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 1, title: 'Variables in Python', content_md: '# Variables', module: 1 },
    });
    renderWithRoute();
    await waitFor(() => expect(screen.getByRole('heading', { name: /Variables in Python/ })).toBeInTheDocument());
  });

  it('passes content_md to MarkdownRenderer', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 1, title: 'Variables in Python', content_md: '# Hello World', module: 1 },
    });
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Hello World');
    });
  });

  it('shows error message on fetch failure', async () => {
    client.getLessonById.mockRejectedValue({ userMessage: 'Not found.' });
    renderWithRoute();
    await waitFor(() => expect(screen.getByText(/Not found/)).toBeInTheDocument());
  });

  it('shows generic error when userMessage is absent', async () => {
    client.getLessonById.mockRejectedValue({});
    renderWithRoute();
    await waitFor(() => expect(screen.getByText(/Failed to load lesson/)).toBeInTheDocument());
  });

  it('shows Back to All Modules link on error', async () => {
    client.getLessonById.mockRejectedValue({ userMessage: 'Not found.' });
    renderWithRoute();
    await waitFor(() => expect(screen.getByText('← Back to All Modules')).toBeInTheDocument());
  });

  it('shows breadcrumb Modules link after lesson loads', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 1, title: 'My Lesson', content_md: '', module: 1 },
    });
    renderWithRoute();
    await waitFor(() => expect(screen.getByRole('link', { name: 'Modules' })).toBeInTheDocument());
  });

  it('shows module title in breadcrumb when module loads', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 1, title: 'My Lesson', content_md: '', module: 1 },
    });
    client.getModuleById.mockResolvedValue({
      data: { id: 1, title: 'Python Basics', description: '', lessons: [] },
    });
    renderWithRoute('1', '?module=1');
    await waitFor(() => expect(screen.getByRole('link', { name: 'Python Basics' })).toBeInTheDocument());
  });

  it('shows back to module link in navigation', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 1, title: 'My Lesson', content_md: '', module: 1 },
    });
    renderWithRoute('1', '?module=1');
    await waitFor(() => expect(screen.getByText('↑ Back to Module')).toBeInTheDocument());
  });

  it('passes the lesson id from the route to getLessonById', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 7, title: 'Lesson 7', content_md: '', module: 1 },
    });
    renderWithRoute('7');
    await waitFor(() => expect(client.getLessonById).toHaveBeenCalledWith('7'));
  });

  it('does not show Mark as complete button when not logged in', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 1, title: 'Lesson', content_md: '', module: 1 },
    });
    renderWithRoute();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Lesson' })).toBeInTheDocument());
    expect(screen.queryByText('Mark as complete')).not.toBeInTheDocument();
  });

  it('shows Mark as complete button when logged in', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { username: 'testuser' }, authLoading: false });
    client.getLessonById.mockResolvedValue({
      data: { id: 1, title: 'Lesson', content_md: '', module: 1 },
    });
    renderWithRoute();
    await waitFor(() => expect(screen.getByText('Mark as complete')).toBeInTheDocument());
  });

  it('shows prev/next navigation when module has multiple lessons', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 2, title: 'Functions', content_md: '', module: 1 },
    });
    client.getModuleById.mockResolvedValue({
      data: {
        id: 1, title: 'Python', description: '', lessons: [
          { id: 1, title: 'Variables', order: 1, content_md: '' },
          { id: 2, title: 'Functions', order: 2, content_md: '' },
          { id: 3, title: 'Classes', order: 3, content_md: '' },
        ],
      },
    });
    renderWithRoute('2', '?module=1');
    await waitFor(() => expect(screen.getByText(/Variables/)).toBeInTheDocument());
    expect(screen.getByText(/Classes/)).toBeInTheDocument();
  });
});
