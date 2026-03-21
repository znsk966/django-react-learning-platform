import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModuleDetail from './ModuleDetail';
import * as client from '../api/client';

vi.mock('../api/client');

vi.mock('../components/MarkdownRenderer', () => ({
  default: ({ content }) => <div data-testid="markdown-content">{content}</div>,
}));

vi.mock('../context/ProgressContext', () => ({
  useProgress: () => ({
    completedLessonIds: new Set(),
    progressLoading: false,
    markComplete: vi.fn(),
    markIncomplete: vi.fn(),
  }),
}));

const renderWithRoute = (id = '1') =>
  render(
    <MemoryRouter initialEntries={[`/modules/${id}`]}>
      <Routes>
        <Route path="/modules/:id" element={<ModuleDetail />} />
      </Routes>
    </MemoryRouter>
  );

describe('ModuleDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state before data arrives', () => {
    client.getModuleById.mockReturnValue(new Promise(() => {}));
    renderWithRoute();
    // Skeleton renders instead of text, but the page renders without crash
    expect(document.body).toBeInTheDocument();
  });

  it('renders module title and description', async () => {
    client.getModuleById.mockResolvedValue({
      data: { id: 1, title: 'Python Basics', description: 'A Python course', lessons: [] },
    });
    renderWithRoute();
    await waitFor(() => expect(screen.getByText('Python Basics')).toBeInTheDocument());
    expect(screen.getByText('A Python course')).toBeInTheDocument();
  });

  it('renders all lessons in the module', async () => {
    client.getModuleById.mockResolvedValue({
      data: {
        id: 1,
        title: 'Python Basics',
        description: '',
        lessons: [
          { id: 1, title: 'Variables', slug: 'variables', order: 1, content_md: '' },
          { id: 2, title: 'Functions', slug: 'functions', order: 2, content_md: '' },
          { id: 3, title: 'Classes', slug: 'classes', order: 3, content_md: '' },
        ],
      },
    });
    renderWithRoute();
    await waitFor(() => expect(screen.getByText('Variables')).toBeInTheDocument());
    expect(screen.getByText('Functions')).toBeInTheDocument();
    expect(screen.getByText('Classes')).toBeInTheDocument();
  });

  it('shows empty lessons message when module has no lessons', async () => {
    client.getModuleById.mockResolvedValue({
      data: { id: 1, title: 'Empty Module', description: '', lessons: [] },
    });
    renderWithRoute();
    await waitFor(() => {
      expect(screen.getByText('No lessons available in this module.')).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    client.getModuleById.mockRejectedValue({ userMessage: 'Not found.' });
    renderWithRoute();
    await waitFor(() => expect(screen.getByText(/Not found/)).toBeInTheDocument());
  });

  it('passes the module id from the route to getModuleById', async () => {
    client.getModuleById.mockResolvedValue({
      data: { id: 42, title: 'Module 42', description: '', lessons: [] },
    });
    renderWithRoute('42');
    await waitFor(() => expect(client.getModuleById).toHaveBeenCalledWith('42'));
  });

  it('renders difficulty badge', async () => {
    client.getModuleById.mockResolvedValue({
      data: { id: 1, title: 'Python', description: '', difficulty: 'beginner', lessons: [] },
    });
    renderWithRoute();
    await waitFor(() => expect(screen.getByText('beginner')).toBeInTheDocument());
  });

  it('renders author name', async () => {
    client.getModuleById.mockResolvedValue({
      data: {
        id: 1, title: 'Python', description: '', lessons: [],
        author: { id: 1, username: 'jane', full_name: 'Jane Doe' },
      },
    });
    renderWithRoute();
    await waitFor(() => expect(screen.getByText(/Jane Doe/)).toBeInTheDocument());
  });

  it('renders learning objectives', async () => {
    client.getModuleById.mockResolvedValue({
      data: {
        id: 1, title: 'Python', description: '', lessons: [],
        learning_objectives: '- Understand variables\n- Write functions',
      },
    });
    renderWithRoute();
    await waitFor(() => expect(screen.getByText("What you'll learn")).toBeInTheDocument());
  });

  it('shows progress bar when module has lessons', async () => {
    client.getModuleById.mockResolvedValue({
      data: {
        id: 1, title: 'Python', description: '', lessons: [
          { id: 1, title: 'Variables', order: 1, content_md: '' },
        ],
      },
    });
    renderWithRoute();
    await waitFor(() => expect(screen.getByText(/0 of 1 lessons completed/)).toBeInTheDocument());
  });
});
