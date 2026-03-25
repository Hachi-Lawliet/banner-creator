'use client';

import { useBannerStore } from '@/store/bannerStore';
import TextInput from './TextInput';
import ImageUploader from './ImageUploader';
import DownloadButton from '../banner/DownloadButton';

export default function InputPanel() {
  const {
    config,
    setTitle,
    setHighlightKeyword,
    setTitleLines,
    setLogoImage,
    setBackgroundImage,
    setBackgroundImage2,
  } = useBannerStore();

  return (
    <aside className="w-[360px] min-w-[360px] h-full overflow-y-auto border-r border-border bg-white p-4 flex flex-col">
      <div className="flex-1">
        {/* Text Section */}
        <section>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
            テキスト
          </h3>
          <TextInput
            title={config.title}
            highlightKeyword={config.highlightKeyword}
            titleLines={config.titleLines}
            accentColor={config.accentColor}
            onTitleChange={setTitle}
            onKeywordChange={setHighlightKeyword}
            onTitleLinesChange={setTitleLines}
          />
        </section>

        <hr className="my-6 border-border" />

        {/* Image Section */}
        <section>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            画像
          </h3>
          <div className="flex flex-col gap-4">
            <ImageUploader
              label="ロゴ画像"
              value={config.logoImage}
              onChange={setLogoImage}
            />

            <ImageUploader
              label="メイン画像①"
              value={config.backgroundImage}
              onChange={setBackgroundImage}
              optional
            />

            <ImageUploader
              label="メイン画像②"
              value={config.backgroundImage2}
              onChange={setBackgroundImage2}
              optional
            />
          </div>
        </section>

      </div>

      {/* Save Button - bottom */}
      <div className="pt-4 border-t border-border mt-4">
        <DownloadButton />
      </div>
    </aside>
  );
}
