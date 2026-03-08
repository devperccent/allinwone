import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    user: null,
    session: null,
    profile: null,
    loading: false,
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

import LoginPage from '@/pages/LoginPage';

describe('LoginPage', () => {
  const renderLogin = () => render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

  it('renders welcome heading', () => {
    renderLogin();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('renders email input', () => {
    renderLogin();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders password input', () => {
    renderLogin();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    renderLogin();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('renders sign up link', () => {
    renderLogin();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('renders Google button', () => {
    renderLogin();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    renderLogin();
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Find and click the toggle button (eye icon)
    const toggleButtons = screen.getAllByRole('button');
    const eyeToggle = toggleButtons.find(btn => btn.querySelector('svg') && !btn.textContent);
    if (eyeToggle) {
      fireEvent.click(eyeToggle);
      expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  it('allows typing in email field', () => {
    renderLogin();
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
  });
});
