import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ModuleCard from './ModuleCard';

vi.mock('lucide-react', () => ({
  Lock: ({ size }) => <span data-testid="lock-icon" data-size={size} />,
}));

const freeModule = {
  id: 1,
  title: 'Python Basics',
  slug: 'python-basics',
  description: 'Learn Python',
  difficulty: 'beginner',
  estimated_duration: 60,
  is_locked: false,
  lessons: [{ id: 1 }, { id: 2 }],
  tags: [],
  author: null,
  thumbnail_url: null,
};

const lockedModule = {
  ...freeModule,
  id: 2,
  title: 'Advanced Python',
  difficulty: 'advanced',
  is_locked: true,
};

const renderCard = (module, completedLessonIds = null) =>
  render(
    <MemoryRouter>
      <ModuleCard module={module} completedLessonIds={completedLessonIds} />
    </MemoryRouter>
  );

describe('ModuleCard', () => {
  it('renders an unlocked module as a Link', () => {
    renderCard(freeModule);
    const link = screen.getByRole('link', { name: /Python Basics/ });
    expect(link).toHaveAttribute('href', '/modules/1');
  });

  it('does not show lock icon for unlocked module', () => {
    renderCard(freeModule);
    expect(screen.queryByTestId('lock-icon')).not.toBeInTheDocument();
  });

  it('renders a locked module as a div (not a Link to the module)', () => {
    renderCard(lockedModule);
    // The module title should be present but no link to /modules/2
    expect(screen.getByText('Advanced Python')).toBeInTheDocument();
    const moduleLink = screen.queryByRole('link', { name: /Advanced Python/ });
    expect(moduleLink).not.toBeInTheDocument();
  });

  it('shows lock icon for locked module', () => {
    renderCard(lockedModule);
    expect(screen.getAllByTestId('lock-icon').length).toBeGreaterThan(0);
  });

  it('shows Pro badge for locked module', () => {
    renderCard(lockedModule);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('shows Upgrade to Pro link for locked module', () => {
    renderCard(lockedModule);
    const upgradeLink = screen.getByRole('link', { name: 'Upgrade to Pro' });
    expect(upgradeLink).toHaveAttribute('href', '/profile');
  });

  it('shows difficulty badge', () => {
    renderCard(freeModule);
    expect(screen.getByText('beginner')).toBeInTheDocument();
  });

  it('shows module title', () => {
    renderCard(freeModule);
    expect(screen.getByText('Python Basics')).toBeInTheDocument();
  });

  it('shows progress when completedLessonIds provided for unlocked module', () => {
    renderCard(freeModule, new Set([1]));
    expect(screen.getByText('1/2 completed')).toBeInTheDocument();
  });

  it('does not show progress for locked module', () => {
    renderCard(lockedModule, new Set([1]));
    expect(screen.queryByText(/completed/)).not.toBeInTheDocument();
  });
});
