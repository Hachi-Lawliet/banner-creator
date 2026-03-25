'use client';

import { useEffect, useState } from 'react';
import { useBannerStore } from '@/store/bannerStore';
import { useHistoryStore, type HistoryEntry } from '@/store/historyStore';

export default function HistoryPanel() {
  const { config, derivedColors, setBrandColor, setAccentColor, setTitle, setHighlightKeyword, setTitleLines, setSize, setOverlayOpacity, setShowDecoration, setLogoPosition, setPhotoClipStyle } = useBannerStore();
  const { entries, loadFromStorage, saveEntry, removeEntry, clearAll } = useHistoryStore();
  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleSave = () => {
    const name = saveName.trim() || `バナー ${new Date().toLocaleString('ja-JP')}`;
    saveEntry(name, config, derivedColors);
    setSaveName('');
    setShowSaveForm(false);
  };

  const handleRestore = (entry: HistoryEntry) => {
    const c = entry.config;
    setBrandColor(c.brandColor);
    setAccentColor(c.accentColor);
    setTitle(c.title);
    setHighlightKeyword(c.highlightKeyword);
    setTitleLines(c.titleLines);
    setSize(c.width, c.height);
    setOverlayOpacity(c.overlayOpacity);
    setShowDecoration(c.showDecoration);
    setLogoPosition(c.logoPosition);
    setPhotoClipStyle(c.photoClipStyle);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {!showSaveForm ? (
          <button
            onClick={() => setShowSaveForm(true)}
            className="flex-1 h-8 text-xs font-medium bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            現在の設定を保存
          </button>
        ) : (
          <div className="flex-1 flex gap-1.5">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="名前（任意）"
              className="flex-1 h-8 px-2 text-xs border border-border rounded-md focus:border-primary focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button
              onClick={handleSave}
              className="h-8 px-3 text-xs font-medium bg-primary text-white rounded-md"
            >
              保存
            </button>
            <button
              onClick={() => setShowSaveForm(false)}
              className="h-8 px-2 text-xs text-muted border border-border rounded-md"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {entries.length > 0 && (
        <>
          <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2 rounded-md border border-border hover:border-primary/50 transition-colors"
              >
                <button
                  onClick={() => handleRestore(entry)}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-medium text-foreground truncate">{entry.name}</div>
                  <div className="text-[10px] text-muted">{formatTime(entry.timestamp)}</div>
                </button>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="ml-2 w-6 h-6 flex items-center justify-center text-muted hover:text-red-500 text-xs"
                  title="削除"
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={clearAll}
            className="text-[11px] text-muted hover:text-red-500 transition-colors text-left"
          >
            履歴をすべて削除
          </button>
        </>
      )}

      {entries.length === 0 && (
        <p className="text-[11px] text-muted">保存された設定はありません</p>
      )}
    </div>
  );
}
