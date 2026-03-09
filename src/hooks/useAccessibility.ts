import { useState, useEffect, useCallback } from 'react';

export interface AccessibilitySettings {
  fontSize: number; // 14-24, default 16
  highContrast: boolean;
  reducedMotion: boolean;
  largeTargets: boolean; // larger buttons/links for elderly
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 16,
  highContrast: false,
  reducedMotion: false,
  largeTargets: false,
};

const STORAGE_KEY = 'inw-accessibility';

function loadSettings(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function applySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;

  // Font size
  root.style.fontSize = `${settings.fontSize}px`;

  // High contrast
  root.classList.toggle('high-contrast', settings.highContrast);

  // Reduced motion
  root.classList.toggle('reduce-motion', settings.reducedMotion);

  // Large targets
  root.classList.toggle('large-targets', settings.largeTargets);
}

export function useAccessibility() {
  const [settings, setSettingsState] = useState<AccessibilitySettings>(loadSettings);

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  // Apply on mount
  useEffect(() => {
    applySettings(loadSettings());
  }, []);

  const updateSettings = useCallback((partial: Partial<AccessibilitySettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSettings, resetSettings };
}
