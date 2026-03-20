import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonPage from './LessonPage';
import * as client from '../api/client';

vi.mock('../api/client');

// MarkdownRenderer uses react-markdown which is complex to render in jsdom
vi.mock('../components/MarkdownRenderer', () => ({
  default: ({ content }) => <div data-testid="markdown-content">{content}</div>,
}));

const renderWithRoute = (id = '1', search = '') =>
  render(
    <MemoryRouter initialEntries={[`/lesson/${id}${search}`]}>
      <Routes>
        <Route path="/lesson/:id" element={<LessonPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('LessonPage', () => {
  beforeEach(() => vi.clearAllMocks());

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

    await waitFor(() => expect(screen.getByText('Variables in Python')).toBeInTheDocument());
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

  it('shows back to module link when ?module param is present', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 1, title: 'My Lesson', content_md: '', module: 5 },
    });

    renderWithRoute('1', '?module=5');

    await waitFor(() => expect(screen.getByText('← Back to Module')).toBeInTheDocument());
  });

  it('always shows back to all modules link', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 1, title: 'My Lesson', content_md: '', module: 1 },
    });

    renderWithRoute();

    await waitFor(() => expect(screen.getByText('← Back to All Modules')).toBeInTheDocument());
  });

  it('passes the lesson id from the route to getLessonById', async () => {
    client.getLessonById.mockResolvedValue({
      data: { id: 7, title: 'Lesson 7', content_md: '', module: 1 },
    });

    renderWithRoute('7');

    await waitFor(() => expect(client.getLessonById).toHaveBeenCalledWith('7'));
  });
});
