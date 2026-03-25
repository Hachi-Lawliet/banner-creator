import { create } from 'zustand';
import type { BannerConfig, DerivedColors, TextLine, LogoPosition, PhotoClipStyle, StampConfig, ManualAdjustment, ManualAdjustments, DraggableElement, TemplateStyle } from '@/types/banner';
import { generateDerivedColors } from '@/lib/color/colorGenerator';

interface BannerStore {
  // State
  config: BannerConfig;
  derivedColors: DerivedColors;
  isGeneratingImage: boolean;

  // Actions - Color
  setBrandColor: (color: string) => void;
  setAccentColor: (color: string) => void;

  // Actions - Text
  setTitle: (title: string) => void;
  setHighlightKeyword: (keyword: string) => void;
  setTitleLines: (lines: TextLine[]) => void;

  // Actions - Images
  setLogoImage: (image: string | null) => void;
  setBackgroundImage: (image: string | null) => void;
  setBackgroundImage2: (image: string | null) => void;
  setIsGeneratingImage: (generating: boolean) => void;

  // Actions - Layout
  setLogoPosition: (position: LogoPosition) => void;
  setPhotoClipStyle: (style: PhotoClipStyle) => void;

  // Actions - Options
  setOverlayOpacity: (opacity: number) => void;
  setShowDecoration: (show: boolean) => void;
  setTemplateStyle: (style: TemplateStyle) => void;

  // Actions - Size
  setSize: (width: number, height: number) => void;

  // Actions - Stamps
  addStamp: (stamp: StampConfig) => void;
  removeStamp: (id: string) => void;
  updateStamp: (id: string, updates: Partial<StampConfig>) => void;

  // Actions - Manual Adjustments
  selectedElement: { type: DraggableElement; id?: string } | null;
  setSelectedElement: (element: { type: DraggableElement; id?: string } | null) => void;
  setElementAdjustment: (elementType: DraggableElement, adjustment: Partial<ManualAdjustment>, stampId?: string) => void;
  resetAdjustments: () => void;

  // Actions - Reset
  reset: () => void;
}

const DEFAULT_CONFIG: BannerConfig = {
  width: 800,
  height: 600,
  brandColor: '#E4740B',
  accentColor: '#E4740B',
  title: '',
  highlightKeyword: '',
  titleLines: [
    { segments: [
      { text: '移転後に', fontWeight: 700 },
      { text: '好転', fontWeight: 700, color: '#E4740B' },
      { text: 'した、社員の', fontWeight: 700 },
      { text: '意識', fontWeight: 700, color: '#E4740B' },
      { text: 'と', fontWeight: 700 },
      { text: '評判', fontWeight: 700, color: '#E4740B' },
    ]},
  ],
  logoPosition: 'top-left',
  photoClipStyle: 'none',
  photoClipSkewAngle: 15,
  logoImage: null,
  backgroundImage: null,
  backgroundImage2: null,
  overlayOpacity: 0.3,
  showDecoration: true,
  templateStyle: 'casestudy' as const,
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

const DEFAULT_DERIVED_COLORS: DerivedColors = {
  light: '#F2B87E',
  medium: '#E4740B',
  dark: '#A35208',
  accent: '#E4740B',
};

export const useBannerStore = create<BannerStore>((set) => ({
  config: DEFAULT_CONFIG,
  derivedColors: DEFAULT_DERIVED_COLORS,
  isGeneratingImage: false,
  selectedElement: null,

  setBrandColor: (color: string) =>
    set((state) => {
      const newConfig = { ...state.config, brandColor: color };
      return {
        config: newConfig,
        derivedColors: generateDerivedColors(color, state.config.accentColor),
      };
    }),

  setAccentColor: (color: string) =>
    set((state) => {
      // Update accent color in titleLines segments that had the old accent color
      const oldAccent = state.config.accentColor;
      const updatedTitleLines = state.config.titleLines.map((line) => ({
        segments: line.segments.map((seg) => {
          if (seg.color && seg.color.toLowerCase() === oldAccent.toLowerCase()) {
            return { ...seg, color };
          }
          return seg;
        }),
      }));
      const newConfig = { ...state.config, accentColor: color, titleLines: updatedTitleLines };
      return {
        config: newConfig,
        derivedColors: generateDerivedColors(state.config.brandColor, color),
      };
    }),

  setTitle: (title: string) =>
    set((state) => ({ config: { ...state.config, title } })),

  setHighlightKeyword: (keyword: string) =>
    set((state) => ({ config: { ...state.config, highlightKeyword: keyword } })),

  setTitleLines: (lines: TextLine[]) =>
    set((state) => ({ config: { ...state.config, titleLines: lines } })),

  setLogoImage: (image: string | null) =>
    set((state) => ({ config: { ...state.config, logoImage: image } })),

  setBackgroundImage: (image: string | null) =>
    set((state) => ({ config: { ...state.config, backgroundImage: image } })),

  setBackgroundImage2: (image: string | null) =>
    set((state) => ({ config: { ...state.config, backgroundImage2: image } })),

  setIsGeneratingImage: (generating: boolean) =>
    set({ isGeneratingImage: generating }),

  setLogoPosition: (position: LogoPosition) =>
    set((state) => ({ config: { ...state.config, logoPosition: position } })),

  setPhotoClipStyle: (style: PhotoClipStyle) =>
    set((state) => ({ config: { ...state.config, photoClipStyle: style } })),

  setOverlayOpacity: (opacity: number) =>
    set((state) => ({
      config: { ...state.config, overlayOpacity: Math.min(0.8, Math.max(0, opacity)) },
    })),

  setShowDecoration: (show: boolean) =>
    set((state) => ({ config: { ...state.config, showDecoration: show } })),

  setTemplateStyle: (style: TemplateStyle) =>
    set((state) => ({ config: { ...state.config, templateStyle: style } })),

  setSize: (width: number, height: number) =>
    set((state) => ({ config: { ...state.config, width, height } })),

  // Stamp actions
  addStamp: (stamp: StampConfig) =>
    set((state) => ({
      config: { ...state.config, stamps: [...state.config.stamps, stamp] },
    })),

  removeStamp: (id: string) =>
    set((state) => ({
      config: {
        ...state.config,
        stamps: state.config.stamps.filter((s) => s.id !== id),
      },
    })),

  updateStamp: (id: string, updates: Partial<StampConfig>) =>
    set((state) => ({
      config: {
        ...state.config,
        stamps: state.config.stamps.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    })),

  // Manual adjustment actions
  setSelectedElement: (element) => set({ selectedElement: element }),

  setElementAdjustment: (elementType, adjustment, stampId) =>
    set((state) => {
      const current = state.config.manualAdjustments;
      if (elementType === 'stamp' && stampId) {
        return {
          config: {
            ...state.config,
            manualAdjustments: {
              ...current,
              stamps: {
                ...current.stamps,
                [stampId]: { ...(current.stamps[stampId] || { dx: 0, dy: 0, scaleX: 1, scaleY: 1 }), ...adjustment },
              },
            },
          },
        };
      }
      if (elementType === 'titleLine' && stampId) {
        return {
          config: {
            ...state.config,
            manualAdjustments: {
              ...current,
              titleLines: {
                ...current.titleLines,
                [stampId]: { ...(current.titleLines[stampId] || { dx: 0, dy: 0, scaleX: 1, scaleY: 1 }), ...adjustment },
              },
            },
          },
        };
      }
      return {
        config: {
          ...state.config,
          manualAdjustments: {
            ...current,
            [elementType]: { ...current[elementType as 'logo' | 'title' | 'backgroundImage' | 'photoClip'], ...adjustment },
          },
        },
      };
    }),

  resetAdjustments: () =>
    set((state) => ({
      config: {
        ...state.config,
        manualAdjustments: DEFAULT_CONFIG.manualAdjustments,
      },
    })),

  reset: () =>
    set({ config: DEFAULT_CONFIG, derivedColors: DEFAULT_DERIVED_COLORS, isGeneratingImage: false, selectedElement: null }),
}));
