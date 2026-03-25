'use client';

import { useEffect, useRef } from 'react';
import { useBannerStore } from '@/store/bannerStore';
import { generateVariations, type BannerVariation } from '@/lib/engine/variationGenerator';
import { renderToCanvas } from '@/lib/engine/canvasRenderer';

interface VariationPanelProps {
  variation: BannerVariation;
  onAdopt: () => void;
  isOriginal: boolean;
}

function VariationPanel({ variation, onAdopt, isOriginal }: VariationPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderToCanvas(canvas, variation.config, variation.derivedColors).catch(() => {
      // Render failed silently
    });
  }, [variation]);

  return (
    <div className="flex flex-col gap-2 border border-border rounded-lg overflow-hidden bg-white">
      <div className="relative bg-gray-100">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          style={{ aspectRatio: `${variation.config.width} / ${variation.config.height}` }}
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-foreground truncate">{variation.label}</span>
        <button
          onClick={onAdopt}
          disabled={isOriginal}
          className={`ml-2 px-3 py-1 text-xs font-medium rounded-md transition-colors shrink-0 ${
            isOriginal
              ? 'bg-gray-100 text-muted cursor-default'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isOriginal ? '現在' : '採用'}
        </button>
      </div>
    </div>
  );
}

export default function ComparisonView() {
  const { config, derivedColors, setBrandColor, setAccentColor, setOverlayOpacity, setTitleLines } = useBannerStore();

  const variations = generateVariations(config, derivedColors);

  const handleAdopt = (variation: BannerVariation, index: number) => {
    if (index === 0) return;

    const v = variation.config;

    if (v.brandColor !== config.brandColor) {
      setBrandColor(v.brandColor);
    }
    if (v.accentColor !== config.accentColor) {
      setAccentColor(v.accentColor);
    }
    if (v.overlayOpacity !== config.overlayOpacity) {
      setOverlayOpacity(v.overlayOpacity);
    }
    // Apply updated titleLines (with new accent colors)
    if (v.titleLines !== config.titleLines) {
      setTitleLines(v.titleLines);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full">
      <p className="text-xs text-muted">
        現在の設定から4つのバリエーションを自動生成します。「採用」ボタンで設定に適用できます。
      </p>
      <div className="grid grid-cols-2 gap-4">
        {variations.map((variation, index) => (
          <VariationPanel
            key={index}
            variation={variation}
            onAdopt={() => handleAdopt(variation, index)}
            isOriginal={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
