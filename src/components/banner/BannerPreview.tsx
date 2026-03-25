'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useBannerStore } from '@/store/bannerStore';
import { renderToCanvas } from '@/lib/engine/canvasRenderer';
import { calculateCaseStudyLayout, calculateEnterkeyLayout, calculateLayout } from '@/lib/engine/layoutCalculator';
import type { LayoutResult } from '@/types/banner';
import InteractionOverlay from './InteractionOverlay';
import AdjustmentPanel from './AdjustmentPanel';

export default function BannerPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { config, derivedColors } = useBannerStore();
  const [fitScale, setFitScale] = useState(1);

  const displayScale = fitScale;

  // Synchronously compute layout for hit testing (no debounce)
  // Create an offscreen canvas for text measurement
  const measureCtx = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    return c.getContext('2d');
  }, []);

  const layout = useMemo<LayoutResult>(() => {
    if (config.templateStyle === 'casestudy') {
      return calculateCaseStudyLayout(config, derivedColors, measureCtx);
    }
    const isEnterkey = (config.titleLines && config.titleLines.length > 0) || config.photoClipStyle === 'skew';
    return isEnterkey
      ? calculateEnterkeyLayout(config, derivedColors, measureCtx)
      : calculateLayout(config, derivedColors, measureCtx);
  }, [config, derivedColors, measureCtx]);

  // Calculate scale to fit preview area
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 48;
      const containerHeight = containerRef.current.clientHeight - 120;
      const scaleX = containerWidth / config.width;
      const scaleY = containerHeight / config.height;
      setFitScale(Math.min(scaleX, scaleY, 1));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [config.width, config.height]);

  // Render banner with debounce (300ms)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      renderToCanvas(canvas, config, derivedColors).then(() => {
        if (cancelled) return;
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [config, derivedColors]);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center p-6 bg-background overflow-auto">
      <div
        className="shadow-lg"
        style={{
          position: 'relative',
          width: config.width * displayScale,
          height: config.height * displayScale,
          backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: config.width * displayScale,
            height: config.height * displayScale,
          }}
          className="block"
        />
        <InteractionOverlay
          layout={layout}
          stamps={config.stamps}
          canvasScale={displayScale}
          canvasWidth={config.width}
          canvasHeight={config.height}
        />
      </div>
      <AdjustmentPanel />

      <div className="mt-4 flex gap-6 text-[11px] text-muted">
        <span>
          サイズ: {config.width} x {config.height}px
        </span>
      </div>
    </div>
  );
}
