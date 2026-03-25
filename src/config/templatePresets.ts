export interface ColorThemePreset {
  id: string;
  name: string;
  brandColor: string;
  accentColor: string;
}

export const COLOR_THEME_PRESETS: ColorThemePreset[] = [
  {
    id: 'orange',
    name: 'オレンジ',
    brandColor: '#E4740B',
    accentColor: '#E4740B',
  },
  {
    id: 'dark-navy',
    name: 'ダークネイビー',
    brandColor: '#1A1A2E',
    accentColor: '#E94560',
  },
  {
    id: 'corporate-blue',
    name: 'コーポレートブルー',
    brandColor: '#2563EB',
    accentColor: '#F59E0B',
  },
  {
    id: 'dark-tech',
    name: 'ダークテック',
    brandColor: '#0F172A',
    accentColor: '#38BDF8',
  },
  {
    id: 'warm-brown',
    name: 'ウォームブラウン',
    brandColor: '#78350F',
    accentColor: '#D97706',
  },
  {
    id: 'purple',
    name: 'パープル',
    brandColor: '#7C3AED',
    accentColor: '#F472B6',
  },
  {
    id: 'forest-green',
    name: 'フォレストグリーン',
    brandColor: '#065F46',
    accentColor: '#34D399',
  },
  {
    id: 'crimson',
    name: 'クリムゾン',
    brandColor: '#991B1B',
    accentColor: '#FCA5A5',
  },
  {
    id: 'sakura',
    name: 'さくら',
    brandColor: '#D4869C',
    accentColor: '#E8B4C8',
  },
  {
    id: 'sky-pastel',
    name: 'そら',
    brandColor: '#7BA7CC',
    accentColor: '#A8CCE8',
  },
  {
    id: 'pistachio',
    name: 'ピスタチオ',
    brandColor: '#8FB596',
    accentColor: '#B8D4BE',
  },
  {
    id: 'lavender',
    name: 'ラベンダー',
    brandColor: '#9B8EC4',
    accentColor: '#C4B8E0',
  },
  {
    id: 'peach',
    name: 'ピーチ',
    brandColor: '#D4956A',
    accentColor: '#E8C4A8',
  },
];
