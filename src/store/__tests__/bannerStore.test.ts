import { useBannerStore } from '../bannerStore';

describe('bannerStore', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useBannerStore.getState().reset();
  });

  it('should have default config', () => {
    const { config } = useBannerStore.getState();
    expect(config.width).toBe(800);
    expect(config.height).toBe(600);
    expect(config.brandColor).toBe('#E4740B');
    expect(config.accentColor).toBe('#E4740B');
    expect(config.title).toBe('');
    expect(config.highlightKeyword).toBe('');
    expect(config.logoImage).toBeNull();
    expect(config.backgroundImage).toBeNull();
    expect(config.overlayOpacity).toBe(0.6);
    expect(config.showDecoration).toBe(true);
    expect(config.templateStyle).toBe('casestudy');
    expect(config.titleLines.length).toBeGreaterThan(0);
  });

  it('should have default derived colors', () => {
    const { derivedColors } = useBannerStore.getState();
    expect(derivedColors.medium).toBe('#E4740B');
    expect(derivedColors.accent).toBe('#E4740B');
  });

  it('should update brand color and recalculate derived colors', () => {
    useBannerStore.getState().setBrandColor('#FF0000');

    const { config, derivedColors } = useBannerStore.getState();
    expect(config.brandColor).toBe('#FF0000');
    // Derived colors should change (chroma-js returns lowercase hex)
    expect(derivedColors.medium.toLowerCase()).toBe('#ff0000');
    expect(derivedColors.light).not.toBe('#93B4F5'); // Should differ from default
  });

  it('should update accent color and recalculate derived colors', () => {
    useBannerStore.getState().setAccentColor('#00FF00');

    const { config, derivedColors } = useBannerStore.getState();
    expect(config.accentColor).toBe('#00FF00');
    // Accent is harmonized (hue preserved, saturation/lightness adjusted)
    expect(derivedColors.accent).toBeDefined();
    expect(typeof derivedColors.accent).toBe('string');
  });

  it('should update title', () => {
    useBannerStore.getState().setTitle('新しいタイトル');

    const { config } = useBannerStore.getState();
    expect(config.title).toBe('新しいタイトル');
  });

  it('should update highlight keyword', () => {
    useBannerStore.getState().setHighlightKeyword('キーワード');

    const { config } = useBannerStore.getState();
    expect(config.highlightKeyword).toBe('キーワード');
  });

  it('should update logo image', () => {
    useBannerStore.getState().setLogoImage('data:image/png;base64,test');

    const { config } = useBannerStore.getState();
    expect(config.logoImage).toBe('data:image/png;base64,test');
  });

  it('should clear logo image', () => {
    useBannerStore.getState().setLogoImage('data:image/png;base64,test');
    useBannerStore.getState().setLogoImage(null);

    const { config } = useBannerStore.getState();
    expect(config.logoImage).toBeNull();
  });

  it('should update background image', () => {
    useBannerStore.getState().setBackgroundImage('data:image/png;base64,bg');

    const { config } = useBannerStore.getState();
    expect(config.backgroundImage).toBe('data:image/png;base64,bg');
  });

  it('should update overlay opacity and clamp to valid range', () => {
    useBannerStore.getState().setOverlayOpacity(0.3);
    expect(useBannerStore.getState().config.overlayOpacity).toBe(0.3);

    // Should clamp to max 0.8
    useBannerStore.getState().setOverlayOpacity(1.0);
    expect(useBannerStore.getState().config.overlayOpacity).toBe(0.8);

    // Should clamp to min 0
    useBannerStore.getState().setOverlayOpacity(-0.5);
    expect(useBannerStore.getState().config.overlayOpacity).toBe(0);
  });

  it('should update showDecoration', () => {
    useBannerStore.getState().setShowDecoration(false);
    expect(useBannerStore.getState().config.showDecoration).toBe(false);

    useBannerStore.getState().setShowDecoration(true);
    expect(useBannerStore.getState().config.showDecoration).toBe(true);
  });

  it('should update size', () => {
    useBannerStore.getState().setSize(1080, 1080);

    const { config } = useBannerStore.getState();
    expect(config.width).toBe(1080);
    expect(config.height).toBe(1080);
  });

  it('should reset to defaults', () => {
    // Change everything
    useBannerStore.getState().setBrandColor('#FF0000');
    useBannerStore.getState().setTitle('Changed');
    useBannerStore.getState().setSize(500, 500);

    // Reset
    useBannerStore.getState().reset();

    const { config, derivedColors } = useBannerStore.getState();
    expect(config.brandColor).toBe('#E4740B');
    expect(config.title).toBe('');
    expect(config.width).toBe(800);
    expect(derivedColors.medium).toBe('#E4740B');
  });

  it('should preserve other config fields when updating one field', () => {
    useBannerStore.getState().setTitle('テスト');
    useBannerStore.getState().setHighlightKeyword('テスト');

    const { config } = useBannerStore.getState();
    expect(config.title).toBe('テスト');
    expect(config.highlightKeyword).toBe('テスト');
    // Other fields unchanged
    expect(config.width).toBe(800);
    expect(config.brandColor).toBe('#E4740B');
  });

  // Enterkey style extensions
  it('should have default enterkey fields', () => {
    const { config } = useBannerStore.getState();
    expect(config.titleLines.length).toBeGreaterThan(0);
    expect(config.logoPosition).toBe('top-left');
    expect(config.photoClipStyle).toBe('none');
    expect(config.photoClipSkewAngle).toBe(15);
  });

  it('should update titleLines', () => {
    useBannerStore.getState().setTitleLines([
      { segments: [{ text: 'テスト' }] },
    ]);

    const { config } = useBannerStore.getState();
    expect(config.titleLines.length).toBe(1);
    expect(config.titleLines[0].segments[0].text).toBe('テスト');
  });

  it('should update logoPosition', () => {
    useBannerStore.getState().setLogoPosition('top-right');

    const { config } = useBannerStore.getState();
    expect(config.logoPosition).toBe('top-right');
  });

  it('should update photoClipStyle', () => {
    useBannerStore.getState().setPhotoClipStyle('skew');

    const { config } = useBannerStore.getState();
    expect(config.photoClipStyle).toBe('skew');
  });

  it('should track isGeneratingImage state', () => {
    expect(useBannerStore.getState().isGeneratingImage).toBe(false);

    useBannerStore.getState().setIsGeneratingImage(true);
    expect(useBannerStore.getState().isGeneratingImage).toBe(true);

    useBannerStore.getState().setIsGeneratingImage(false);
    expect(useBannerStore.getState().isGeneratingImage).toBe(false);
  });

  it('should reset enterkey fields on reset', () => {
    useBannerStore.getState().setTitleLines([{ segments: [{ text: 'x' }] }]);
    useBannerStore.getState().setLogoPosition('top-right');
    useBannerStore.getState().setIsGeneratingImage(true);

    useBannerStore.getState().reset();

    const { config, isGeneratingImage } = useBannerStore.getState();
    expect(config.titleLines.length).toBeGreaterThan(0);
    expect(config.logoPosition).toBe('top-left');
    expect(isGeneratingImage).toBe(false);
  });

  // Stamp actions
  it('addStamp should append a stamp to config.stamps', () => {
    const stamp = {
      id: 'stamp-1',
      type: 'stamp-circle' as const,
      position: 'auto' as const,
      size: 0.1,
      color: 'brand' as const,
      opacity: 1.0,
      rotation: 0,
    };
    useBannerStore.getState().addStamp(stamp);

    const { config } = useBannerStore.getState();
    expect(config.stamps).toHaveLength(1);
    expect(config.stamps[0].id).toBe('stamp-1');
    expect(config.stamps[0].type).toBe('stamp-circle');
  });

  it('addStamp should add multiple stamps independently', () => {
    const stamp1 = {
      id: 'stamp-1',
      type: 'stamp-circle' as const,
      position: 'auto' as const,
      size: 0.1,
      color: 'brand' as const,
      opacity: 1.0,
      rotation: 0,
    };
    const stamp2 = {
      id: 'stamp-2',
      type: 'stamp-triangle' as const,
      position: 'auto' as const,
      size: 0.15,
      color: 'accent' as const,
      opacity: 0.8,
      rotation: 45,
    };

    useBannerStore.getState().addStamp(stamp1);
    useBannerStore.getState().addStamp(stamp2);

    expect(useBannerStore.getState().config.stamps).toHaveLength(2);
  });

  it('removeStamp should remove the stamp with matching id', () => {
    const stamp = {
      id: 'stamp-remove',
      type: 'stamp-ring' as const,
      position: 'auto' as const,
      size: 0.1,
      color: 'light' as const,
      opacity: 0.9,
      rotation: 0,
    };
    useBannerStore.getState().addStamp(stamp);
    expect(useBannerStore.getState().config.stamps).toHaveLength(1);

    useBannerStore.getState().removeStamp('stamp-remove');
    expect(useBannerStore.getState().config.stamps).toHaveLength(0);
  });

  it('removeStamp should not affect other stamps', () => {
    const stamp1 = {
      id: 'keep',
      type: 'stamp-line' as const,
      position: 'auto' as const,
      size: 0.1,
      color: 'brand' as const,
      opacity: 1.0,
      rotation: 0,
    };
    const stamp2 = {
      id: 'remove',
      type: 'stamp-dot-grid' as const,
      position: 'auto' as const,
      size: 0.1,
      color: 'brand' as const,
      opacity: 1.0,
      rotation: 0,
    };
    useBannerStore.getState().addStamp(stamp1);
    useBannerStore.getState().addStamp(stamp2);

    useBannerStore.getState().removeStamp('remove');

    const { config } = useBannerStore.getState();
    expect(config.stamps).toHaveLength(1);
    expect(config.stamps[0].id).toBe('keep');
  });

  it('updateStamp should update properties of an existing stamp', () => {
    const stamp = {
      id: 'stamp-update',
      type: 'stamp-circle' as const,
      position: 'auto' as const,
      size: 0.1,
      color: 'brand' as const,
      opacity: 1.0,
      rotation: 0,
    };
    useBannerStore.getState().addStamp(stamp);

    useBannerStore.getState().updateStamp('stamp-update', { opacity: 0.5, rotation: 90 });

    const { config } = useBannerStore.getState();
    expect(config.stamps[0].opacity).toBe(0.5);
    expect(config.stamps[0].rotation).toBe(90);
    expect(config.stamps[0].type).toBe('stamp-circle'); // unchanged
  });

  it('updateStamp with unknown id should not throw', () => {
    expect(() => {
      useBannerStore.getState().updateStamp('nonexistent', { opacity: 0.3 });
    }).not.toThrow();
  });

  // setSelectedElement
  it('setSelectedElement should set the selected element', () => {
    useBannerStore.getState().setSelectedElement({ type: 'logo' });

    expect(useBannerStore.getState().selectedElement).toEqual({ type: 'logo' });
  });

  it('setSelectedElement should set stamp type with id', () => {
    useBannerStore.getState().setSelectedElement({ type: 'stamp', id: 'stamp-1' });

    expect(useBannerStore.getState().selectedElement).toEqual({ type: 'stamp', id: 'stamp-1' });
  });

  it('setSelectedElement should clear selection when null is passed', () => {
    useBannerStore.getState().setSelectedElement({ type: 'title' });
    useBannerStore.getState().setSelectedElement(null);

    expect(useBannerStore.getState().selectedElement).toBeNull();
  });

  // setElementAdjustment
  it('setElementAdjustment should update logo adjustment', () => {
    useBannerStore.getState().setElementAdjustment('logo', { dx: 10, dy: 20 });

    const { config } = useBannerStore.getState();
    expect(config.manualAdjustments.logo.dx).toBe(10);
    expect(config.manualAdjustments.logo.dy).toBe(20);
    expect(config.manualAdjustments.logo.scaleX).toBe(1); // unchanged
  });

  it('setElementAdjustment should update title adjustment', () => {
    useBannerStore.getState().setElementAdjustment('title', { scaleX: 1.2, scaleY: 0.8 });

    const { config } = useBannerStore.getState();
    expect(config.manualAdjustments.title.scaleX).toBe(1.2);
    expect(config.manualAdjustments.title.scaleY).toBe(0.8);
  });

  it('setElementAdjustment should update stamp adjustment with stampId', () => {
    useBannerStore.getState().setElementAdjustment('stamp', { dx: 5, dy: -5 }, 'stamp-1');

    const { config } = useBannerStore.getState();
    expect(config.manualAdjustments.stamps['stamp-1'].dx).toBe(5);
    expect(config.manualAdjustments.stamps['stamp-1'].dy).toBe(-5);
  });

  it('setElementAdjustment should initialize stamp adjustment with defaults if not existing', () => {
    useBannerStore.getState().setElementAdjustment('stamp', { dx: 15 }, 'new-stamp');

    const { config } = useBannerStore.getState();
    expect(config.manualAdjustments.stamps['new-stamp'].dx).toBe(15);
    expect(config.manualAdjustments.stamps['new-stamp'].scaleX).toBe(1);
  });

  // resetAdjustments
  it('resetAdjustments should reset all adjustments to defaults', () => {
    useBannerStore.getState().setElementAdjustment('logo', { dx: 50, dy: 30 });
    useBannerStore.getState().setElementAdjustment('title', { scaleX: 2.0 });
    useBannerStore.getState().setElementAdjustment('stamp', { dx: 10 }, 'stamp-x');

    useBannerStore.getState().resetAdjustments();

    const { config } = useBannerStore.getState();
    expect(config.manualAdjustments.logo.dx).toBe(0);
    expect(config.manualAdjustments.logo.dy).toBe(0);
    expect(config.manualAdjustments.logo.scaleX).toBe(1);
    expect(config.manualAdjustments.title.scaleX).toBe(1);
    expect(config.manualAdjustments.stamps).toEqual({});
  });

  it('resetAdjustments should not affect other config fields', () => {
    useBannerStore.getState().setTitle('保持されるタイトル');
    useBannerStore.getState().setElementAdjustment('logo', { dx: 50 });

    useBannerStore.getState().resetAdjustments();

    expect(useBannerStore.getState().config.title).toBe('保持されるタイトル');
  });
});
