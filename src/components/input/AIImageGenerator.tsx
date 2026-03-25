'use client';

import { useState } from 'react';

type Provider = 'dalle' | 'gemini';

const DALLE_ALLOWED_DOMAINS = ['https://oaidalleapiprodscus.blob.core.windows.net'];

function isDalleAllowedUrl(url: string): boolean {
  return DALLE_ALLOWED_DOMAINS.some(d => url.startsWith(d));
}

interface AIImageGeneratorProps {
  onApply: (imageDataUrl: string) => void;
}

export default function AIImageGenerator({ onApply }: AIImageGeneratorProps) {
  const [provider, setProvider] = useState<Provider>('dalle');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setPreviewUrl(null);

    try {
      if (provider === 'dalle') {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim(), size: '1792x1024' }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to generate image');
          return;
        }

        if (!isDalleAllowedUrl(data.imageUrl)) {
          setError('Invalid image URL returned from API');
          return;
        }

        setPreviewUrl(data.imageUrl);
      } else {
        // Gemini
        const res = await fetch('/api/generate-image-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to generate image');
          return;
        }

        // Gemini returns a data URL directly
        setPreviewUrl(data.imageUrl);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!previewUrl) return;

    try {
      if (previewUrl.startsWith('data:')) {
        // Already a data URL (Gemini response)
        onApply(previewUrl);
        return;
      }

      // Fetch the image and convert to data URL (DALL-E)
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onApply(dataUrl);
      };
      reader.readAsDataURL(blob);
    } catch {
      setError('Failed to load image. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm text-foreground">AI画像生成</label>

      {/* Provider selector */}
      <div className="flex gap-2">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="ai-provider"
            value="dalle"
            checked={provider === 'dalle'}
            onChange={() => {
              setProvider('dalle');
              setPreviewUrl(null);
              setError(null);
            }}
            className="accent-primary"
          />
          <span className="text-xs text-foreground">DALL-E 3</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="ai-provider"
            value="gemini"
            checked={provider === 'gemini'}
            onChange={() => {
              setProvider('gemini');
              setPreviewUrl(null);
              setError(null);
            }}
            className="accent-primary"
          />
          <span className="text-xs text-foreground">Gemini Imagen</span>
        </label>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="背景画像のプロンプトを入力（英語推奨）&#10;例: Modern office space with people collaborating, bright and professional atmosphere"
        rows={3}
        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:border-primary focus:outline-none resize-none"
        disabled={isGenerating}
      />

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="h-9 px-4 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? '生成中...' : 'AI画像を生成'}
      </button>

      {error && (
        <p className="text-[11px] text-red-500">{error}</p>
      )}

      {previewUrl && (
        <div className="flex flex-col gap-2">
          <img
            src={previewUrl}
            alt="AI generated preview"
            className="w-full h-32 object-cover border border-border rounded-lg"
          />
          <button
            onClick={handleApply}
            className="h-9 px-4 text-sm font-medium border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
          >
            背景に適用
          </button>
        </div>
      )}

      <p className="text-[11px] text-muted">
        {provider === 'dalle'
          ? 'DALL-E 3でバナー背景画像を生成します。OPENAI_API_KEYの設定が必要です。'
          : 'Gemini Imagenでバナー背景画像を生成します。GOOGLE_AI_API_KEYの設定が必要です。'}
      </p>
    </div>
  );
}
