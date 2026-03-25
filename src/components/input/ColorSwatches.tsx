'use client';

import type { DerivedColors } from '@/types/banner';

interface ColorSwatchesProps {
  derivedColors: DerivedColors;
}

export default function ColorSwatches({ derivedColors }: ColorSwatchesProps) {
  const swatches = [
    { label: 'ライト', color: derivedColors.light },
    { label: 'ミディアム', color: derivedColors.medium },
    { label: 'ダーク', color: derivedColors.dark },
    { label: 'アクセント', color: derivedColors.accent },
  ];

  return (
    <div className="flex gap-2 mt-2">
      {swatches.map((swatch) => (
        <div key={swatch.label} className="flex flex-col items-center gap-1">
          <div
            className="w-8 h-8 rounded border border-border"
            style={{ backgroundColor: swatch.color }}
            title={`${swatch.label}: ${swatch.color}`}
          />
          <span className="text-[11px] text-muted">{swatch.label}</span>
        </div>
      ))}
    </div>
  );
}
