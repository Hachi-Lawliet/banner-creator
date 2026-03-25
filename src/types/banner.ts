// Rich text segment within a line
export interface TextSegment {
  text: string;
  color?: string; // override color (default: white)
  fontWeight?: number; // override weight (default: 400)
}

// A single line of rich text
export interface TextLine {
  segments: TextSegment[];
}

// Logo position presets
export type LogoPosition = 'top-left' | 'top-center' | 'top-right';

// Photo clip style
export type PhotoClipStyle = 'none' | 'skew';

// Template rendering style
export type TemplateStyle = 'classic' | 'enterkey' | 'casestudy';

// Banner configuration (user input)
export interface BannerConfig {
  width: number;
  height: number;
  brandColor: string; // hex color
  accentColor: string; // hex color
  title: string;
  highlightKeyword: string;
  titleLines: TextLine[]; // rich text lines (new enterkey style)
  logoPosition: LogoPosition;
  photoClipStyle: PhotoClipStyle;
  photoClipSkewAngle: number; // degrees (default: 15)
  logoImage: string | null; // base64 data URL
  backgroundImage: string | null; // base64 data URL
  backgroundImage2: string | null; // second main image
  overlayOpacity: number; // 0 - 0.8
  showDecoration: boolean;
  stamps: StampConfig[];
  manualAdjustments: ManualAdjustments;
  templateStyle: TemplateStyle;
}

// Derived colors from brand color (HSL manipulation)
export interface DerivedColors {
  light: string; // H, S-10%, L+20%
  medium: string; // original brand color
  dark: string; // H, S+5%, L-20%
  accent: string; // user-specified accent color
}

// Layout calculation result for a single element
export interface ElementLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  rotation?: number;
  opacity?: number;
  color?: string;
  backgroundColor?: string;
  text?: string;
}

// Layout for a single text segment within a line
export interface TextSegmentLayout {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  color: string;
  fontWeight: number;
}

// Layout for a rich text line
export interface TextLineLayout {
  segments: TextSegmentLayout[];
  y: number;
  height: number;
}

// Photo clip path coordinates
export interface PhotoClipLayout {
  points: Array<{ x: number; y: number }>;
  gradientStops: Array<{ offset: number; opacity: number }>;
}

// Complete layout calculation result
export interface LayoutResult {
  canvasWidth: number;
  canvasHeight: number;
  safeArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  logo: ElementLayout;
  title: ElementLayout;
  highlightKeyword: ElementLayout & {
    bandColor: string;
    bandPadding: number;
  };
  background: ElementLayout;
  overlay: ElementLayout & {
    opacity: number;
    color: string;
  };
  decorations: DecorationLayout[];
  gravityCenter: { x: number; y: number };
  contrastRatio: number;
  // Enterkey style extensions
  photoClip?: PhotoClipLayout;
  photoClip2?: PhotoClipLayout;
  titleLineLayouts?: TextLineLayout[];
}

// Draggable element types for manual adjustment
export type DraggableElement = 'logo' | 'title' | 'titleLine' | 'highlightKeyword' | 'stamp' | 'backgroundImage' | 'photoClip';

// Manual position/scale adjustment
export interface ManualAdjustment {
  dx: number;
  dy: number;
  scaleX: number;
  scaleY: number;
}

// Manual adjustments for all draggable elements
export interface ManualAdjustments {
  logo: ManualAdjustment;
  title: ManualAdjustment;
  titleLines: Record<string, ManualAdjustment>;
  backgroundImage: ManualAdjustment;
  photoClip: ManualAdjustment;
  stamps: Record<string, ManualAdjustment>;
}

// Decoration element types
export type DecorationType =
  | 'stripe-border'
  | 'accent-line'
  | 'stripe-triangle-corner'
  | 'stamp-circle'
  | 'stamp-triangle'
  | 'stamp-line'
  | 'stamp-dot-grid'
  | 'stamp-gradient-band'
  | 'stamp-ring';

export interface DecorationLayout extends ElementLayout {
  type: DecorationType;
  visible: boolean;
}

// Stamp configuration
export interface StampConfig {
  id: string;
  type: DecorationType;
  position: 'auto' | { x: number; y: number };
  size: number; // ratio to canvas width 0.05-0.3
  color: 'brand' | 'accent' | 'light' | 'custom';
  customColor?: string;
  opacity: number; // 0.1-1.0
  rotation: number; // 0-360
}

// Size preset definition
export interface SizePreset {
  name: string;
  width: number;
  height: number;
}

// Layout parameters (loaded from config/layout.json)
export interface LayoutParams {
  safeAreaRatio: number;
  goldenRatio: number;
  titleFontSizeRatio: { min: number; max: number };
  subtitleFontSizeRatio: { min: number; max: number };
  logoMinSizeRatio: number;
  logoClearSpaceRatio: number;
  gravityCenterTarget: { min: number; max: number };
  overlayDefault: number;
  overlayMax: number;
  accentAreaRatio: { min: number; max: number };
  sizePresets: SizePreset[];
}

// Render layer order
export const RENDER_LAYER_ORDER = [
  'background-color',
  'background-image',
  'overlay',
  'decoration',
  'title',
  'logo',
] as const;

export type RenderLayerType = (typeof RENDER_LAYER_ORDER)[number];

// Image validation constraints
export const IMAGE_CONSTRAINTS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedFormats: ['image/png'],
  minWidth: 1,
  minHeight: 1,
} as const;
