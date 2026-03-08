import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/dashboard/StatCard';
import { IndianRupee } from 'lucide-react';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Revenue" value="₹10,000" icon={IndianRupee} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('₹10,000')).toBeInTheDocument();
  });

  it('renders change text', () => {
    render(<StatCard title="Test" value="5" change="3 paid" changeType="positive" icon={IndianRupee} />);
    expect(screen.getByText('3 paid')).toBeInTheDocument();
  });

  it('renders without change', () => {
    render(<StatCard title="Test" value="0" icon={IndianRupee} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('applies correct color for negative change', () => {
    render(<StatCard title="Test" value="5" change="Needs attention" changeType="negative" icon={IndianRupee} />);
    const el = screen.getByText('Needs attention');
    expect(el.className).toContain('text-destructive');
  });

  it('applies correct color for positive change', () => {
    render(<StatCard title="Test" value="5" change="All good" changeType="positive" icon={IndianRupee} />);
    const el = screen.getByText('All good');
    expect(el.className).toContain('text-success');
  });
});
