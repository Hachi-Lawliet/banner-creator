import { create } from 'zustand';
import type { BannerConfig, DerivedColors } from '@/types/banner';

const STORAGE_KEY = 'banner-creator-history';
const MAX_HISTORY = 20;

export interface HistoryEntry {
  id: string;
  name: string;
  timestamp: number;
  config: BannerConfig;
  derivedColors: DerivedColors;
}

interface HistoryStore {
  entries: HistoryEntry[];
  loadFromStorage: () => void;
  saveEntry: (name: string, config: BannerConfig, derivedColors: DerivedColors) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
}

function persistEntries(entries: HistoryEntry[]): void {
  try {
    // Strip backgroundImage and logoImage to save space
    const stripped = entries.map((e) => ({
      ...e,
      config: {
        ...e.config,
        backgroundImage: null,
        logoImage: null,
      },
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
  } catch {
    // localStorage full or unavailable
  }
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: [],

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HistoryEntry[];
        set({ entries: parsed });
      }
    } catch {
      // Invalid data, reset
      set({ entries: [] });
    }
  },

  saveEntry: (name, config, derivedColors) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      timestamp: Date.now(),
      config,
      derivedColors,
    };
    const entries = [entry, ...get().entries].slice(0, MAX_HISTORY);
    set({ entries });
    persistEntries(entries);
  },

  removeEntry: (id) => {
    const entries = get().entries.filter((e) => e.id !== id);
    set({ entries });
    persistEntries(entries);
  },

  clearAll: () => {
    set({ entries: [] });
    localStorage.removeItem(STORAGE_KEY);
  },
}));
