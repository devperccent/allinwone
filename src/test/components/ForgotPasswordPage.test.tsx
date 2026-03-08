import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }) },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import ForgotPasswordPage from '@/pages/ForgotPasswordPage';

describe('ForgotPasswordPage', () => {
  it('renders heading', () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
  });

  it('renders email input', () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
  });

  it('has back to login link', () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    expect(screen.getByText('Back to login')).toBeInTheDocument();
  });
});
