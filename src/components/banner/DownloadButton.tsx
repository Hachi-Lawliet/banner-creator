'use client';

import { useCallback, useRef } from 'react';
import { useBannerStore } from '@/store/bannerStore';
import { renderToCanvas } from '@/lib/engine/canvasRenderer';

export default function DownloadButton() {
  const { config, derivedColors } = useBannerStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const downloadPNG = useCallback(async () => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;

    await renderToCanvas(canvas, config, derivedColors);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const title = config.title.slice(0, 20).replace(/[^a-zA-Z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '_') || 'banner';
      a.download = `${title}_${config.width}x${config.height}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [config, derivedColors]);

  return (
    <button
      onClick={downloadPNG}
      className="w-full h-10 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
    >
      保存（PNG）
    </button>
  );
}
