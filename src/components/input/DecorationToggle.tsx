'use client';

interface DecorationToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function DecorationToggle({ value, onChange }: DecorationToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-foreground">装飾要素</label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-primary rounded"
        />
        <span className="text-sm text-foreground">ストライプ枠・英語装飾テキスト</span>
      </label>
    </div>
  );
}
