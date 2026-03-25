import { useHistoryStore } from '../historyStore';
import type { BannerConfig, DerivedColors } from '@/types/banner';

const mockConfig: BannerConfig = {
  width: 1200,
  height: 628,
  brandColor: '#2563EB',
  accentColor: '#F59E0B',
  title: 'テスト',
  highlightKeyword: '',
  titleLines: [],
  logoPosition: 'top-left',
  photoClipStyle: 'none',
  photoClipSkewAngle: 15,
  logoImage: null,
  backgroundImage: null,
  backgroundImage2: null,
  overlayOpacity: 0.5,
  showDecoration: true,
  templateStyle: 'classic' as const,
  stamps: [],
  manualAdjustments: {
    logo: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 },
    title: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 },
    titleLines: {},
    backgroundImage: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 },
    photoClip: { dx: 0, dy: 0, scaleX: 1, scaleY: 1 },
    stamps: {},
  },
};

const mockColors: DerivedColors = {
  light: '#93B4F5',
  medium: '#2563EB',
  dark: '#1A3FA0',
  accent: '#F59E0B',
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.setState({ entries: [] });
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should start with empty entries', () => {
    expect(useHistoryStore.getState().entries).toEqual([]);
  });

  it('should save an entry', () => {
    useHistoryStore.getState().saveEntry('テストバナー', mockConfig, mockColors);

    const { entries } = useHistoryStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('テストバナー');
    expect(entries[0].config.brandColor).toBe('#2563EB');
    expect(entries[0].derivedColors.accent).toBe('#F59E0B');
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should strip images when persisting to localStorage', () => {
    const configWithImages = {
      ...mockConfig,
      backgroundImage: 'data:image/png;base64,very-large-data',
      logoImage: 'data:image/png;base64,logo-data',
    };
    useHistoryStore.getState().saveEntry('画像付き', configWithImages, mockColors);

    const storedJson = localStorageMock.setItem.mock.calls[0][1];
    const stored = JSON.parse(storedJson);
    expect(stored[0].config.backgroundImage).toBeNull();
    expect(stored[0].config.logoImage).toBeNull();
  });

  it('should save multiple entries and maintain order (newest first)', () => {
    useHistoryStore.getState().saveEntry('1番目', mockConfig, mockColors);
    useHistoryStore.getState().saveEntry('2番目', mockConfig, mockColors);
    useHistoryStore.getState().saveEntry('3番目', mockConfig, mockColors);

    const { entries } = useHistoryStore.getState();
    expect(entries).toHaveLength(3);
    expect(entries[0].name).toBe('3番目');
    expect(entries[2].name).toBe('1番目');
  });

  it('should limit to MAX_HISTORY (20) entries', () => {
    for (let i = 0; i < 25; i++) {
      useHistoryStore.getState().saveEntry(`エントリ${i}`, mockConfig, mockColors);
    }

    const { entries } = useHistoryStore.getState();
    expect(entries).toHaveLength(20);
    expect(entries[0].name).toBe('エントリ24');
  });

  it('should remove an entry by id', () => {
    useHistoryStore.getState().saveEntry('削除対象', mockConfig, mockColors);
    useHistoryStore.getState().saveEntry('残るもの', mockConfig, mockColors);

    const id = useHistoryStore.getState().entries[1].id;
    useHistoryStore.getState().removeEntry(id);

    const { entries } = useHistoryStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('残るもの');
  });

  it('should clear all entries', () => {
    useHistoryStore.getState().saveEntry('1', mockConfig, mockColors);
    useHistoryStore.getState().saveEntry('2', mockConfig, mockColors);

    useHistoryStore.getState().clearAll();

    expect(useHistoryStore.getState().entries).toEqual([]);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('banner-creator-history');
  });

  it('should load entries from localStorage', () => {
    const stored = [
      {
        id: 'test-id',
        name: 'ロード済み',
        timestamp: Date.now(),
        config: mockConfig,
        derivedColors: mockColors,
      },
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(stored));

    useHistoryStore.getState().loadFromStorage();

    const { entries } = useHistoryStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('ロード済み');
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValueOnce('invalid json');

    useHistoryStore.getState().loadFromStorage();

    expect(useHistoryStore.getState().entries).toEqual([]);
  });

  it('should handle empty localStorage', () => {
    localStorageMock.getItem.mockReturnValueOnce(null);

    useHistoryStore.getState().loadFromStorage();

    expect(useHistoryStore.getState().entries).toEqual([]);
  });

  it('should generate unique ids for each entry', () => {
    useHistoryStore.getState().saveEntry('A', mockConfig, mockColors);
    useHistoryStore.getState().saveEntry('B', mockConfig, mockColors);

    const { entries } = useHistoryStore.getState();
    expect(entries[0].id).not.toBe(entries[1].id);
  });

  it('should include timestamp in entries', () => {
    const before = Date.now();
    useHistoryStore.getState().saveEntry('タイムスタンプ', mockConfig, mockColors);
    const after = Date.now();

    const { entries } = useHistoryStore.getState();
    expect(entries[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(entries[0].timestamp).toBeLessThanOrEqual(after);
  });
});
