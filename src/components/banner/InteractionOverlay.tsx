'use client';

import { useRef, useCallback } from 'react';
import type { LayoutResult, StampConfig } from '@/types/banner';
import { useBannerStore } from '@/store/bannerStore';
import { hitTest } from '@/lib/interaction/hitTest';
import SelectionFrame from './SelectionFrame';

interface Props {
  layout: LayoutResult | null;
  stamps: StampConfig[];
  canvasScale: number;
  canvasWidth: number;
  canvasHeight: number;
}

interface DragState {
  active: boolean;
  startX: number;
  startY: number;
  initialDx: number;
  initialDy: number;
}

function getRelativeCoords(e: React.MouseEvent<HTMLDivElement>): { x: number; y: number } {
  const rect = e.currentTarget.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

export default function InteractionOverlay({
  layout,
  stamps,
  canvasScale,
  canvasWidth,
  canvasHeight,
}: Props) {
  const store = useBannerStore();
  const dragState = useRef<DragState>({
    active: false,
    startX: 0,
    startY: 0,
    initialDx: 0,
    initialDy: 0,
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!layout) return;
      const { x, y } = getRelativeCoords(e);
      const currentConfig = useBannerStore.getState().config;
      const hit = hitTest(x, y, layout, stamps, canvasScale, !!currentConfig.backgroundImage);

      if (hit) {
        e.preventDefault();
        useBannerStore.getState().setSelectedElement(hit);

        // Capture initial adjustment values at drag start
        const adj = currentConfig.manualAdjustments;
        let initialAdj = { dx: 0, dy: 0 };
        if (hit.type === 'stamp' && hit.id) {
          initialAdj = adj.stamps[hit.id] ?? { dx: 0, dy: 0 };
        } else if (hit.type === 'backgroundImage') {
          initialAdj = adj.backgroundImage;
        } else if (hit.type === 'logo' || hit.type === 'title') {
          initialAdj = adj[hit.type];
        }

        dragState.current = {
          active: true,
          startX: e.clientX,
          startY: e.clientY,
          initialDx: initialAdj.dx,
          initialDy: initialAdj.dy,
        };
      } else {
        useBannerStore.getState().setSelectedElement(null);
      }
    },
    [layout, stamps, canvasScale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const ds = dragState.current;
      if (!ds.active) return;

      const sel = useBannerStore.getState().selectedElement;
      if (!sel) return;

      // Absolute position from drag start (no accumulation needed)
      const dx = ds.initialDx + (e.clientX - ds.startX) / canvasScale;
      const dy = ds.initialDy + (e.clientY - ds.startY) / canvasScale;

      useBannerStore.getState().setElementAdjustment(
        sel.type,
        { dx, dy },
        sel.id
      );
    },
    [canvasScale]
  );

  const handleMouseUp = useCallback(() => {
    dragState.current.active = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    dragState.current.active = false;
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasWidth * canvasScale,
        height: canvasHeight * canvasScale,
        cursor: !layout ? 'wait' : dragState.current.active ? 'grabbing' : 'default',
        pointerEvents: layout ? 'auto' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {store.selectedElement && layout && (
        <SelectionFrame
          selectedElement={store.selectedElement}
          layout={layout}
          canvasScale={canvasScale}
        />
      )}
    </div>
  );
}
