'use client';

import layoutConfig from '@/config/layout.json';
import type { SizePreset } from '@/types/banner';

interface SizeSelectorProps {
  width: number;
  height: number;
  onChange: (width: number, height: number) => void;
}

const presets: SizePreset[] = layoutConfig.sizePresets;

export default function SizeSelector({ width, height, onChange }: SizeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm text-foreground">プリセット</label>
      <div className="flex flex-col gap-2">
        {presets.map((preset) => (
          <label
            key={preset.name}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              name="size-preset"
              checked={width === preset.width && height === preset.height}
              onChange={() => onChange(preset.width, preset.height)}
              className="accent-primary"
            />
            <span className="text-sm text-foreground">
              {preset.name}
              <span className="text-muted ml-1">
                {preset.width}x{preset.height}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
