import { COLOR_THEME_PRESETS } from '../templatePresets';

describe('colorThemePresets', () => {
  it('should have at least 3 presets', () => {
    expect(COLOR_THEME_PRESETS.length).toBeGreaterThanOrEqual(3);
  });

  it('should have unique ids', () => {
    const ids = COLOR_THEME_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each preset should have required fields', () => {
    for (const preset of COLOR_THEME_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.brandColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(preset.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
