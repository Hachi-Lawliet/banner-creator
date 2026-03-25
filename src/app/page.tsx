'use client';

import InputPanel from '@/components/input/InputPanel';
import BannerPreview from '@/components/banner/BannerPreview';

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-14 min-h-[56px] flex items-center justify-between px-5 bg-header-bg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="white" strokeWidth="2" />
              <path d="M2 8h20" stroke="white" strokeWidth="2" />
              <path d="M8 8v12" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-header-text leading-tight">BannerCreator</h1>
            <p className="text-[10px] text-header-text/50">toB Web Banner Generator</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        <InputPanel />
        <BannerPreview />
      </div>
    </div>
  );
}
