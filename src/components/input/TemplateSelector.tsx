'use client';

import { useBannerStore } from '@/store/bannerStore';
import { COLOR_THEME_PRESETS } from '@/config/templatePresets';

export default function TemplateSelector() {
  const { config, setBrandColor, setAccentColor } = useBannerStore();

  const applyTheme = (brandColor: string, accentColor: string) => {
    setBrandColor(brandColor);
    setAccentColor(accentColor);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_THEME_PRESETS.map((theme) => {
        const isActive =
          config.brandColor.toLowerCase() === theme.brandColor.toLowerCase() &&
          config.accentColor.toLowerCase() === theme.accentColor.toLowerCase();
        return (
          <button
            key={theme.id}
            onClick={() => applyTheme(theme.brandColor, theme.accentColor)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              isActive
                ? 'border-primary bg-primary-light/30'
                : 'border-border hover:border-primary/50'
            }`}
            title={theme.name}
          >
            <div className="flex gap-1">
              <span
                className="w-5 h-5 rounded-sm"
                style={{ backgroundColor: theme.brandColor }}
              />
              <span
                className="w-5 h-5 rounded-sm"
                style={{ backgroundColor: theme.accentColor }}
              />
            </div>
            <span className="text-xs text-foreground">{theme.name}</span>
          </button>
        );
      })}
    </div>
  );
}
