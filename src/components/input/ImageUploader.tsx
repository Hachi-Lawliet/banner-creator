'use client';

import { useCallback, useRef, useState } from 'react';
import { IMAGE_CONSTRAINTS } from '@/types/banner';

interface ImageUploaderProps {
  label: string;
  value: string | null;
  onChange: (image: string | null) => void;
  optional?: boolean;
}

function validateFile(file: File): string | null {
  if (file.size > IMAGE_CONSTRAINTS.maxFileSize) {
    return `ファイルサイズが${IMAGE_CONSTRAINTS.maxFileSize / (1024 * 1024)}MBを超えています`;
  }
  if (!IMAGE_CONSTRAINTS.acceptedFormats.includes(file.type as typeof IMAGE_CONSTRAINTS.acceptedFormats[number])) {
    return 'PNG形式のみ対応しています';
  }
  return null;
}

const MAX_PREVIEW_WIDTH = 1200;

function validateImageDimensions(img: HTMLImageElement): string | null {
  if (img.width < IMAGE_CONSTRAINTS.minWidth || img.height < IMAGE_CONSTRAINTS.minHeight) {
    return `画像サイズは最小${IMAGE_CONSTRAINTS.minWidth}x${IMAGE_CONSTRAINTS.minHeight}px以上にしてください`;
  }
  return null;
}

/**
 * Resize image if wider than MAX_PREVIEW_WIDTH for performance.
 * Returns a data URL of the resized image.
 */
function resizeImageIfNeeded(img: HTMLImageElement, maxWidth: number): string | null {
  if (img.width <= maxWidth) return null;

  const scale = maxWidth / img.width;
  const newWidth = Math.round(img.width * scale);
  const newHeight = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, newWidth, newHeight);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function ImageUploader({ label, value, onChange, optional }: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      const fileError = validateFile(file);
      if (fileError) {
        setError(fileError);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;

        const img = new Image();
        img.onload = () => {
          const dimError = validateImageDimensions(img);
          if (dimError) {
            setError(dimError);
            return;
          }
          // Auto-resize large images for performance
          const resized = resizeImageIfNeeded(img, MAX_PREVIEW_WIDTH);
          onChange(resized || dataUrl);
        };
        img.onerror = () => setError('画像の読み込みに失敗しました');
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-foreground">
        {label}
        {optional && <span className="text-muted ml-1">(任意)</span>}
      </label>

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt={label}
            className="w-full h-24 object-contain border border-border rounded-lg bg-white"
          />
          <button
            onClick={() => {
              onChange(null);
              setError(null);
            }}
            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-border text-muted hover:text-foreground text-xs"
            aria-label="削除"
          >
            x
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center h-[100px] border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary-light/20'
              : 'border-border bg-background hover:border-primary'
          }`}
        >
          <p className="text-sm text-muted">ドラッグ&ドロップ</p>
          <p className="text-[11px] text-muted mt-1">またはクリックして選択</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_CONSTRAINTS.acceptedFormats.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      <p className="text-[11px] text-muted">
        PNG形式, 10MB以下
        {label === 'ロゴ画像' && ' / 推奨: 200x160px'}
        {label === 'メイン画像' && ' / 推奨: 700x450px'}
      </p>
    </div>
  );
}
