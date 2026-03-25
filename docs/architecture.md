# BannerCreator アーキテクチャ設計

## 1. ディレクトリ構成

```
banner-creator/
├── docs/                          # ドキュメント
│   ├── architecture.md            # 本ドキュメント
│   ├── design-principles.md       # デザイン原則
│   ├── design-system.md           # デザインシステム
│   ├── requirements.md            # 要件定義
│   └── wireframes/                # ワイヤーフレーム
├── public/                        # 静的ファイル
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── globals.css            # グローバルスタイル
│   │   ├── layout.tsx             # ルートレイアウト（Noto Sans JP設定）
│   │   └── page.tsx               # メインページ
│   ├── components/
│   │   ├── banner/                # バナー関連コンポーネント
│   │   │   ├── BannerPreview.tsx  # Canvas プレビュー
│   │   │   └── DownloadButton.tsx # PNG/SVG ダウンロード
│   │   ├── input/                 # 入力パネルコンポーネント
│   │   │   ├── InputPanel.tsx     # 入力パネル全体
│   │   │   ├── ColorPicker.tsx    # カラーピッカー
│   │   │   ├── ColorSwatches.tsx  # 派生色スウォッチ
│   │   │   ├── TextInput.tsx      # タイトル・キーワード入力
│   │   │   ├── ImageUploader.tsx  # 画像アップロード
│   │   │   ├── SizeSelector.tsx   # サイズ選択
│   │   │   ├── OverlaySlider.tsx  # オーバーレイ濃度
│   │   │   └── DecorationToggle.tsx # 装飾ON/OFF
│   │   └── ui/                    # 共通UIコンポーネント
│   ├── config/
│   │   └── layout.json            # レイアウトパラメータ（外部化）
│   ├── lib/
│   │   ├── color/                 # 配色計算
│   │   │   ├── colorGenerator.ts  # 派生カラー生成
│   │   │   ├── contrastChecker.ts # WCAG AA コントラスト比
│   │   │   └── overlayCalculator.ts # オーバーレイ計算
│   │   ├── engine/                # レンダリングエンジン
│   │   │   ├── layoutCalculator.ts # レイアウト計算（共通）
│   │   │   ├── canvasRenderer.ts  # Canvas描画（プレビュー）
│   │   │   └── svgGenerator.ts    # SVG生成（書き出し）
│   │   └── layout/                # レイアウト計算ユーティリティ
│   │       ├── goldenRatio.ts     # 黄金比計算
│   │       ├── gravityCenter.ts   # 重心計算
│   │       ├── safeArea.ts        # セーフエリア計算
│   │       └── eyeFlow.ts         # 視線誘導（Z型）
│   ├── store/
│   │   └── bannerStore.ts         # Zustand 状態管理
│   └── types/
│       └── banner.ts              # 型定義
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## 2. データフロー

```
ユーザー入力
    │
    ▼
┌──────────────────┐
│  Input Components │  (ColorPicker, TextInput, ImageUploader, etc.)
│  (src/components/ │
│   input/)         │
└────────┬─────────┘
         │ Zustand actions
         ▼
┌──────────────────┐
│  BannerStore     │  (src/store/bannerStore.ts)
│  ├─ config       │  BannerConfig (ユーザー入力値)
│  └─ derivedColors│  DerivedColors (自動計算)
└────────┬─────────┘
         │ subscribe / useStore
         ▼
┌──────────────────┐
│  BannerPreview   │  (src/components/banner/BannerPreview.tsx)
│                  │
│  1. store変更検知 │
│  2. レイアウト計算│ ← layoutCalculator.ts
│  3. Canvas描画   │ ← canvasRenderer.ts
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  DownloadButton  │  (src/components/banner/DownloadButton.tsx)
│                  │
│  PNG: Canvas     │ → toBlob() → download
│  SVG: svgGen     │ → SVG文字列 → Blob → download
└──────────────────┘
```

## 3. Zustand Store設計

### State構造

```typescript
interface BannerStore {
  // State
  config: BannerConfig;       // ユーザー入力値
  derivedColors: DerivedColors; // 派生カラー（自動計算）

  // Actions
  setBrandColor: (color: string) => void;
  setAccentColor: (color: string) => void;
  setTitle: (title: string) => void;
  setHighlightKeyword: (keyword: string) => void;
  setLogoImage: (image: string | null) => void;
  setBackgroundImage: (image: string | null) => void;
  setOverlayOpacity: (opacity: number) => void;   // 0-0.8
  setShowDecoration: (show: boolean) => void;
  setSize: (width: number, height: number) => void;
  reset: () => void;
}
```

### 初期値

| フィールド | 初期値 |
|-----------|--------|
| width | 1200 |
| height | 628 |
| brandColor | #2563EB |
| accentColor | #F59E0B |
| overlayOpacity | 0.5 |
| showDecoration | true |

### 派生カラー自動計算

`setBrandColor` / `setAccentColor` 呼び出し時に `generateDerivedColors()` を自動実行し、`derivedColors` を更新。

## 4. レンダリングパイプライン

```
BannerConfig + DerivedColors
         │
         ▼
┌──────────────────────┐
│  layoutCalculator.ts │  ← 共通のレイアウト計算
│                      │
│  入力: BannerConfig,  │
│        DerivedColors  │
│  出力: LayoutResult   │
│                      │
│  処理:               │
│  1. セーフエリア計算  │ ← safeArea.ts
│  2. Z型ゾーン計算    │ ← eyeFlow.ts
│  3. 黄金比分割       │ ← goldenRatio.ts
│  4. ロゴ配置         │
│  5. タイトル配置     │
│  6. フォントサイズ   │ ← 二分探索
│  7. 重心計算・調整   │ ← gravityCenter.ts
│  8. 装飾配置         │
│  9. コントラスト確認  │ ← contrastChecker.ts
└─────────┬────────────┘
          │
     LayoutResult
          │
    ┌─────┴──────┐
    ▼            ▼
┌────────┐  ┌────────┐
│Canvas  │  │ SVG    │
│Renderer│  │Generator│
│        │  │        │
│プレビュー│  │書き出し │
└────────┘  └────────┘
```

### Canvas描画レイヤー順（必守）

1. 背景色（derivedColors.light）
2. 背景画像（背景画像なしの場合: ブランドカラーグラデーション）
3. オーバーレイ（derivedColors.dark × opacity）
4. 装飾（ストライプ枠、英語装飾テキスト）
5. タイトル（キーワード強調帯含む）
6. ロゴ

## 5. モジュール責務と公開API

### src/lib/color/colorGenerator.ts
```typescript
// ブランドカラーからHSL操作で派生3色+アクセントを生成
generateDerivedColors(brandColor: string, accentColor: string): DerivedColors

// 背景画像なし時のグラデーション文字列生成
generateBrandGradient(derivedColors: DerivedColors): string
```

### src/lib/color/contrastChecker.ts
```typescript
// WCAG準拠のコントラスト比計算
getContrastRatio(color1: string, color2: string): number

// WCAG AA基準(4.5:1)チェック
meetsWCAG_AA(foreground: string, background: string, isLargeText?: boolean): boolean

// WCAG AA達成に必要な最小オーバーレイ濃度を二分探索で特定
findMinOverlayOpacity(textColor: string, backgroundColor: string, overlayColor: string, targetRatio?: number): number
```

### src/lib/color/overlayCalculator.ts
```typescript
// オーバーレイRGBA値を計算
calculateOverlayColor(brandDarkColor: string, opacity: number): string

// グラデーション停止点を生成
generateGradientStops(lightColor: string, mediumColor: string, darkColor: string): Array<[number, string]>
```

### src/lib/layout/goldenRatio.ts
```typescript
// 寸法を黄金比で分割 → [major(61.8%), minor(38.2%)]
goldenSplit(total: number): [number, number]

// 黄金比位置を取得
goldenPosition(total: number, fromStart?: boolean): number

// タイトル/サブタイトルのフォント比率
goldenFontRatio(titleSize: number): number
```

### src/lib/layout/gravityCenter.ts
```typescript
// 重心Y座標を計算（0-1, 目標: 0.4-0.5）
calculateGravityCenter(elements: WeightedElement[]): number

// 重心が目標範囲内か判定
isGravityCenterBalanced(gravityY: number, targetMin?: number, targetMax?: number): boolean

// 重心調整方向を提案
suggestGravityAdjustment(gravityY: number, targetMin?: number, targetMax?: number): number
```

### src/lib/layout/safeArea.ts
```typescript
// セーフエリア（10%マージン）を計算
calculateSafeArea(width: number, height: number, marginRatio?: number): SafeAreaRect

// 要素がセーフエリア内か判定
isWithinSafeArea(x: number, y: number, w: number, h: number, safeArea: SafeAreaRect): boolean

// 要素位置をセーフエリア内にクランプ
clampToSafeArea(x: number, y: number, w: number, h: number, safeArea: SafeAreaRect): {x, y}
```

### src/lib/layout/eyeFlow.ts
```typescript
// Z型パターンの5ゾーンを計算
calculateZPatternZones(safeArea: SafeAreaRect): ZPatternZones

// アスペクト比からパターンタイプを判定
getPatternType(width: number, height: number): 'z-pattern' | 'f-pattern'
```

### src/lib/engine/layoutCalculator.ts
```typescript
// 二分探索でフォントサイズを最適化
findOptimalFontSize(ctx: CanvasRenderingContext2D | null, text: string, maxWidth: number, minSize: number, maxSize: number): number

// Template Bのレイアウトを完全計算
calculateLayout(config: BannerConfig, derivedColors: DerivedColors, measureCtx?: CanvasRenderingContext2D | null): LayoutResult
```

### src/lib/engine/canvasRenderer.ts
```typescript
// Canvasにバナーを描画（プレビュー用）
renderToCanvas(canvas: HTMLCanvasElement, config: BannerConfig, derivedColors: DerivedColors): Promise<LayoutResult>
```

### src/lib/engine/svgGenerator.ts
```typescript
// SVG文字列を生成（書き出し用）
generateSVG(config: BannerConfig, derivedColors: DerivedColors): string
```
