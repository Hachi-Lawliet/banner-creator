'use client';

import { useCallback, useRef } from 'react';
import type { LayoutResult } from '@/types/banner';
import type { HitTestResult } from '@/lib/interaction/hitTest';
import { useBannerStore } from '@/store/bannerStore';

interface Props {
  selectedElement: HitTestResult;
  layout: LayoutResult;
  canvasScale: number;
}

type HandlePosition = 'nw' | 'ne' | 'sw' | 'se';

const HANDLE_SIZE = 8;

export default function SelectionFrame({ selectedElement, layout, canvasScale }: Props) {
  const { setElementAdjustment, config } = useBannerStore();
  const resizeDragState = useRef<{
    active: boolean;
    handle: HandlePosition;
    startX: number;
    startY: number;
    startScaleX: number;
    startScaleY: number;
    elementWidth: number;
    elementHeight: number;
  } | null>(null);

  const getElementRect = () => {
    const { type, id } = selectedElement;
    let rect = { x: 0, y: 0, width: 0, height: 0 };

    // layout already has manualAdjustments applied by layoutCalculator
    // so we just use the layout values directly
    if (type === 'logo') {
      rect = layout.logo;
    } else if (type === 'title') {
      rect = layout.title;
    } else if (type === 'titleLine') {
      // Per-line selection: includes white band + brand color shadow
      if (layout.titleLineLayouts && id != null) {
        const lineIdx = parseInt(id, 10);
        const line = layout.titleLineLayouts[lineIdx];
        if (line && line.segments.length > 0) {
          const firstSeg = line.segments[0];
          const lastSeg = line.segments[line.segments.length - 1];
          const fs = layout.title.fontSize || 36;
          const padXLocal = fs * 0.4;
          const padYLocal = fs * 0.15;
          const shadowOX = -12;
          const shadowOY = 12;
          // Band bounds
          const bandX = firstSeg.x - padXLocal;
          const bandY = line.y - padYLocal;
          const bandW = lastSeg.x + lastSeg.width - firstSeg.x + padXLocal * 2;
          const bandH = fs + padYLocal * 2;
          // Include shadow in selection area
          const selX = Math.min(bandX, bandX + shadowOX);
          const selY = Math.min(bandY, bandY + shadowOY);
          const selRight = Math.max(bandX + bandW, bandX + shadowOX + bandW);
          const selBottom = Math.max(bandY + bandH, bandY + shadowOY + bandH);
          rect = {
            x: selX,
            y: selY,
            width: selRight - selX,
            height: selBottom - selY,
          };
        }
      }
    } else if (type === 'highlightKeyword') {
      rect = layout.highlightKeyword;
    } else if (type === 'photoClip') {
      if (layout.photoClip && layout.photoClip.points.length >= 4) {
        const pts = layout.photoClip.points;
        const minX = Math.min(...pts.map(p => p.x));
        const maxX = Math.max(...pts.map(p => p.x));
        const minY = Math.min(...pts.map(p => p.y));
        const maxY = Math.max(...pts.map(p => p.y));
        rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
    } else if (type === 'backgroundImage') {
      // Approximate rendered image bounds based on cover-fit + adjustments
      const bgAdj = config.manualAdjustments.backgroundImage;
      const cw = layout.canvasWidth;
      const ch = layout.canvasHeight;
      const scaledW = cw * bgAdj.scaleX;
      const scaledH = ch * bgAdj.scaleY;
      rect = {
        x: (cw - scaledW) / 2 + bgAdj.dx,
        y: (ch - scaledH) / 2 + bgAdj.dy,
        width: scaledW,
        height: scaledH,
      };
    } else if (type === 'stamp' && id) {
      const dec = layout.decorations.find((_, i) => {
        const stampIds = Object.keys(config.manualAdjustments.stamps);
        return stampIds[i] === id;
      });
      if (dec) rect = dec;
    }

    return {
      x: rect.x * canvasScale,
      y: rect.y * canvasScale,
      width: rect.width * canvasScale,
      height: rect.height * canvasScale,
      logicalWidth: rect.width,
      logicalHeight: rect.height,
    };
  };

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: HandlePosition) => {
      e.preventDefault();
      e.stopPropagation();

      const { type, id } = selectedElement;
      let adj = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };
      let baseWidth = 0;
      let baseHeight = 0;

      if (type === 'logo') {
        adj = config.manualAdjustments.logo;
        baseWidth = layout.logo.width;
        baseHeight = layout.logo.height;
      } else if (type === 'title') {
        adj = config.manualAdjustments.title;
        baseWidth = layout.title.width;
        baseHeight = layout.title.height;
      } else if (type === 'stamp' && id) {
        adj = config.manualAdjustments.stamps[id] ?? adj;
        const dec = layout.decorations[0];
        if (dec) { baseWidth = dec.width; baseHeight = dec.height; }
      }

      resizeDragState.current = {
        active: true,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startScaleX: adj.scaleX,
        startScaleY: adj.scaleY,
        elementWidth: baseWidth,
        elementHeight: baseHeight,
      };

      const onMove = (ev: MouseEvent) => {
        const ds = resizeDragState.current;
        if (!ds?.active) return;

        const rawDx = (ev.clientX - ds.startX) / canvasScale;
        const rawDy = (ev.clientY - ds.startY) / canvasScale;

        let newScaleX = ds.startScaleX;
        let newScaleY = ds.startScaleY;

        if (ds.handle === 'se') {
          newScaleX = Math.max(0.1, ds.startScaleX + rawDx / ds.elementWidth);
          newScaleY = Math.max(0.1, ds.startScaleY + rawDy / ds.elementHeight);
        } else if (ds.handle === 'sw') {
          newScaleX = Math.max(0.1, ds.startScaleX - rawDx / ds.elementWidth);
          newScaleY = Math.max(0.1, ds.startScaleY + rawDy / ds.elementHeight);
        } else if (ds.handle === 'ne') {
          newScaleX = Math.max(0.1, ds.startScaleX + rawDx / ds.elementWidth);
          newScaleY = Math.max(0.1, ds.startScaleY - rawDy / ds.elementHeight);
        } else if (ds.handle === 'nw') {
          newScaleX = Math.max(0.1, ds.startScaleX - rawDx / ds.elementWidth);
          newScaleY = Math.max(0.1, ds.startScaleY - rawDy / ds.elementHeight);
        }

        setElementAdjustment(
          selectedElement.type,
          { scaleX: newScaleX, scaleY: newScaleY },
          selectedElement.id
        );
      };

      const onUp = () => {
        if (resizeDragState.current) resizeDragState.current.active = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [selectedElement, config, layout, canvasScale, setElementAdjustment]
  );

  const rect = getElementRect();

  const handles: Array<{ pos: HandlePosition; style: React.CSSProperties }> = [
    {
      pos: 'nw',
      style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nw-resize' },
    },
    {
      pos: 'ne',
      style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'ne-resize' },
    },
    {
      pos: 'sw',
      style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'sw-resize' },
    },
    {
      pos: 'se',
      style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'se-resize' },
    },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        border: '2px dashed #3b82f6',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      {handles.map(({ pos, style }) => (
        <div
          key={pos}
          onMouseDown={(e) => handleResizeMouseDown(e, pos)}
          style={{
            position: 'absolute',
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            background: '#ffffff',
            border: '2px solid #3b82f6',
            borderRadius: 1,
            pointerEvents: 'all',
            ...style,
          }}
        />
      ))}
    </div>
  );
}
