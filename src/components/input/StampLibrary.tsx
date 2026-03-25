'use client';

import { useBannerStore } from '@/store/bannerStore';
import type { StampConfig, DecorationType } from '@/types/banner';

const STAMP_TYPES: { type: DecorationType; label: string; icon: string }[] = [
  { type: 'stamp-circle', label: '円', icon: '○' },
  { type: 'stamp-triangle', label: '三角', icon: '△' },
  { type: 'stamp-line', label: '線', icon: '—' },
  { type: 'stamp-dot-grid', label: 'ドット', icon: '⠿' },
  { type: 'stamp-gradient-band', label: 'グラデ帯', icon: '▬' },
  { type: 'stamp-ring', label: 'リング', icon: '◎' },
];

const COLOR_OPTIONS: { value: StampConfig['color']; label: string }[] = [
  { value: 'brand', label: 'ブランド' },
  { value: 'accent', label: 'アクセント' },
  { value: 'light', label: 'ライト' },
  { value: 'custom', label: 'カスタム' },
];

export default function StampLibrary() {
  const { config, addStamp, removeStamp, updateStamp } = useBannerStore();

  function handleAddStamp(type: DecorationType) {
    const stamp: StampConfig = {
      id: crypto.randomUUID(),
      type,
      position: 'auto',
      size: 0.12,
      color: 'accent',
      opacity: 0.7,
      rotation: 0,
    };
    addStamp(stamp);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stamp type grid */}
      <div>
        <p className="text-[11px] text-muted mb-2">追加するスタンプを選択</p>
        <div className="grid grid-cols-3 gap-2">
          {STAMP_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => handleAddStamp(type)}
              className="flex flex-col items-center justify-center h-14 border border-border rounded-md hover:border-primary hover:bg-primary/5 transition-colors gap-1"
              title={label}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px] text-muted">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Added stamps list */}
      {config.stamps.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] text-muted">追加済みスタンプ</p>
          {config.stamps.map((stamp) => (
            <StampItem
              key={stamp.id}
              stamp={stamp}
              onUpdate={(updates) => updateStamp(stamp.id, updates)}
              onRemove={() => removeStamp(stamp.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StampItemProps {
  stamp: StampConfig;
  onUpdate: (updates: Partial<StampConfig>) => void;
  onRemove: () => void;
}

function StampItem({ stamp, onUpdate, onRemove }: StampItemProps) {
  const typeInfo = STAMP_TYPES.find((t) => t.type === stamp.type);

  return (
    <div className="border border-border rounded-md p-3 flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          {typeInfo?.icon} {typeInfo?.label}
        </span>
        <button
          onClick={onRemove}
          className="text-[10px] text-red-400 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
        >
          削除
        </button>
      </div>

      {/* Size */}
      <div>
        <label className="block text-[10px] text-muted mb-1">
          サイズ: {Math.round(stamp.size * 100)}%
        </label>
        <input
          type="range"
          min={5}
          max={30}
          value={Math.round(stamp.size * 100)}
          onChange={(e) => onUpdate({ size: Number(e.target.value) / 100 })}
          className="w-full h-1.5 accent-primary"
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-[10px] text-muted mb-1">
          透明度: {Math.round(stamp.opacity * 100)}%
        </label>
        <input
          type="range"
          min={10}
          max={100}
          value={Math.round(stamp.opacity * 100)}
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) / 100 })}
          className="w-full h-1.5 accent-primary"
        />
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-[10px] text-muted mb-1">
          回転: {stamp.rotation}°
        </label>
        <input
          type="range"
          min={0}
          max={360}
          value={stamp.rotation}
          onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
          className="w-full h-1.5 accent-primary"
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-[10px] text-muted mb-1">カラー</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onUpdate({ color: value })}
              className={`h-6 px-2 text-[10px] rounded border transition-colors ${
                stamp.color === value
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {stamp.color === 'custom' && (
          <input
            type="color"
            value={stamp.customColor || '#ffffff'}
            onChange={(e) => onUpdate({ customColor: e.target.value })}
            className="mt-1.5 w-full h-7 rounded border border-border cursor-pointer"
          />
        )}
      </div>
    </div>
  );
}
