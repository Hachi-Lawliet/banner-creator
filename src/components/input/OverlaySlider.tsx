'use client';

interface OverlaySliderProps {
  value: number; // 0-0.8
  onChange: (value: number) => void;
}

export default function OverlaySlider({ value, onChange }: OverlaySliderProps) {
  const percentage = Math.round(value * 100);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-foreground">画像グラデーション濃度</label>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted w-8">0%</span>
        <input
          type="range"
          min={0}
          max={80}
          value={percentage}
          onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
          className="flex-1 h-1 accent-primary cursor-pointer"
        />
        <span className="text-[11px] text-muted w-8">80%</span>
      </div>
      <p className="text-[11px] text-muted text-center">{percentage}%</p>
    </div>
  );
}
