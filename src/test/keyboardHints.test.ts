import { describe, it, expect, beforeEach } from 'vitest';
import { isKeyboardHintsEnabled, setKeyboardHintsEnabled } from '@/components/onboarding/KeyboardShortcutsHint';

describe('KeyboardShortcutsHint helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to disabled', () => {
    expect(isKeyboardHintsEnabled()).toBe(false);
  });

  it('enables hints', () => {
    setKeyboardHintsEnabled(true);
    expect(isKeyboardHintsEnabled()).toBe(true);
    expect(localStorage.getItem('inw-shortcuts-hint-enabled')).toBe('true');
    // Dismissed flag should be removed when enabling
    expect(localStorage.getItem('inw-shortcuts-hint-dismissed')).toBeNull();
  });

  it('disables hints and sets dismissed flag', () => {
    setKeyboardHintsEnabled(true);
    setKeyboardHintsEnabled(false);
    expect(isKeyboardHintsEnabled()).toBe(false);
    expect(localStorage.getItem('inw-shortcuts-hint-dismissed')).toBe('true');
  });

  it('dispatches custom event', () => {
    let received: boolean | null = null;
    const handler = (e: Event) => { received = (e as CustomEvent).detail; };
    window.addEventListener('keyboard-hints-changed', handler);
    
    setKeyboardHintsEnabled(true);
    expect(received).toBe(true);
    
    setKeyboardHintsEnabled(false);
    expect(received).toBe(false);
    
    window.removeEventListener('keyboard-hints-changed', handler);
  });
});
