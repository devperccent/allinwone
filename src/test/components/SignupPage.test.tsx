import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: vi.fn().mockResolvedValue({ error: null }),
    user: null, session: null, profile: null, loading: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn(), resolvedTheme: 'light' }),
}));

vi.mock('@/integrations/lovable/index', () => ({
  lovable: { auth: { signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) } },
}));

import SignupPage from '@/pages/SignupPage';

describe('SignupPage', () => {
  const renderSignup = () => render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>
  );

  it('renders create account heading', () => {
    renderSignup();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });

  it('renders business name field', () => {
    renderSignup();
    expect(screen.getByLabelText('Business Name')).toBeInTheDocument();
  });

  it('renders email field', () => {
    renderSignup();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders password field', () => {
    renderSignup();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('button disabled without valid password', () => {
    renderSignup();
    const btn = screen.getByRole('button', { name: 'Create account' });
    expect(btn).toBeDisabled();
  });

  it('shows password requirements when typing', () => {
    renderSignup();
    const pwInput = screen.getByLabelText('Password');
    fireEvent.change(pwInput, { target: { value: 'a' } });
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('Contains a number')).toBeInTheDocument();
    expect(screen.getByText('Contains uppercase')).toBeInTheDocument();
  });

  it('enables button with valid password', () => {
    renderSignup();
    const pwInput = screen.getByLabelText('Password');
    fireEvent.change(pwInput, { target: { value: 'SecurePass1' } });
    const btn = screen.getByRole('button', { name: 'Create account' });
    expect(btn).not.toBeDisabled();
  });

  it('has sign in link', () => {
    renderSignup();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });
});
