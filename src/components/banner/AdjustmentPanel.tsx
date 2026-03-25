'use client';

import { useBannerStore } from '@/store/bannerStore';
import type { ManualAdjustment } from '@/types/banner';

const ELEMENT_LABELS: Record<string, string> = {
  logo: 'ロゴ',
  title: 'タイトル',
  highlightKeyword: 'ハイライトキーワード',
  stamp: 'スタンプ',
};

export default function AdjustmentPanel() {
  const { selectedElement, config, setElementAdjustment, resetAdjustments } = useBannerStore();

  if (!selectedElement) return null;

  const { type, id } = selectedElement;

  const getAdj = (): ManualAdjustment => {
    if (type === 'stamp' && id) {
      return config.manualAdjustments.stamps[id] ?? { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };
    }
    if (type === 'logo' || type === 'title') {
      return config.manualAdjustments[type];
    }
    return { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };
  };

  const adj = getAdj();
  const label = ELEMENT_LABELS[type] ?? type;

  const handleChange = (field: keyof ManualAdjustment, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setElementAdjustment(type, { [field]: num }, id);
  };

  const handleReset = () => {
    setElementAdjustment(type, { dx: 0, dy: 0, scaleX: 1, scaleY: 1 }, id);
  };

  return (
    <div className="mt-3 p-3 bg-white border border-border rounded-lg shadow-sm text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-foreground">{label}の微調整</span>
        <div className="flex gap-1">
          <button
            onClick={handleReset}
            className="px-2 py-1 text-[11px] bg-white border border-border rounded hover:bg-gray-50 text-muted"
          >
            リセット
          </button>
          <button
            onClick={resetAdjustments}
            className="px-2 py-1 text-[11px] bg-white border border-border rounded hover:bg-gray-50 text-muted"
          >
            全リセット
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(
          [
            { field: 'dx' as const, label: 'X移動', step: 1, min: -2000, max: 2000 },
            { field: 'dy' as const, label: 'Y移動', step: 1, min: -2000, max: 2000 },
            { field: 'scaleX' as const, label: '幅倍率', step: 0.01, min: 0.1, max: 5 },
            { field: 'scaleY' as const, label: '高倍率', step: 0.01, min: 0.1, max: 5 },
          ] as const
        ).map(({ field, label: fieldLabel, step, min, max }) => (
          <div key={field} className="flex flex-col gap-0.5">
            <label className="text-[10px] text-muted">{fieldLabel}</label>
            <input
              type="number"
              value={Math.round(adj[field] * 100) / 100}
              step={step}
              min={min}
              max={max}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full h-7 px-1.5 border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
