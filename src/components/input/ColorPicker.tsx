'use client';

import { useState } from 'react';

const PRESET_COLORS = [
  { name: 'ネイビー', color: '#1E3A5F' },
  { name: 'ロイヤルブルー', color: '#2563EB' },
  { name: 'ティール', color: '#0D9488' },
  { name: 'エメラルド', color: '#059669' },
  { name: 'インディゴ', color: '#4F46E5' },
  { name: 'パープル', color: '#7C3AED' },
  { name: 'ローズ', color: '#E11D48' },
  { name: 'オレンジ', color: '#EA580C' },
  { name: 'アンバー', color: '#D97706' },
  { name: 'スレート', color: '#475569' },
  { name: 'ブラック', color: '#18181B' },
  { name: 'ゴールド', color: '#B8860B' },
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <label className="text-sm text-foreground min-w-[120px]">{label}</label>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-md border border-border cursor-pointer bg-transparent p-0"
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
              onChange(v);
            }
          }}
          className="w-24 h-9 px-3 text-sm border border-border rounded-md bg-white focus:border-primary focus:outline-none"
          maxLength={7}
        />
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="h-7 px-2 text-[11px] text-muted hover:text-foreground border border-border rounded-md transition-colors"
          title="プリセットカラー"
        >
          {showPresets ? '閉じる' : 'パレット'}
        </button>
      </div>
      {showPresets && (
        <div className="ml-[132px] grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.color}
              onClick={() => {
                onChange(preset.color);
                setShowPresets(false);
              }}
              className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                value.toLowerCase() === preset.color.toLowerCase()
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
