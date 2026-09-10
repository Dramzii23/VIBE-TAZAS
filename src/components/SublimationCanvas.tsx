import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Maximize2, 
  Eye, 
  EyeOff, 
  Grid3X3, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  Move, 
  AlignCenter, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Scissors,
  Plus,
  Minus,
  Scaling
} from 'lucide-react';
import { UploadedImage, DesignCanvasSettings, STANDARD_MUG_SPEC, ImageTransform, FitMode } from '../types';
import { 
  computeInitialTransform, 
  transformToCentimeters, 
  scaleTransformByFactor,
  CANVAS_ASPECT_RATIO 
} from '../utils/transformUtils';

interface SublimationCanvasProps {
  image: UploadedImage | null;
  settings: DesignCanvasSettings;
  onUpdateSettings: (settings: Partial<DesignCanvasSettings>) => void;
  onTriggerUpload: () => void;
}

type CornerHandle = 'nw' | 'ne' | 'se' | 'sw';

export const SublimationCanvas: React.FC<SublimationCanvasProps> = ({
  image,
  settings,
  onUpdateSettings,
  onTriggerUpload,
}) => {
  const [activeZoneTooltip, setActiveZoneTooltip] = useState<string | null>(null);
  const [isSelected, setIsSelected] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeResizeHandle, setActiveResizeHandle] = useState<CornerHandle | null>(null);

  // References for drag & resize operations
  const designAreaRef = useRef<HTMLDivElement | null>(null);

  // Active transform: from settings or calculated on the fly
  const transform: ImageTransform = settings.imageTransform || (image 
    ? computeInitialTransform(image.width, image.height, settings.fitMode) 
    : { x: 0, y: 0, width: 100, height: 100 }
  );

  // Keep latest transform and settings in refs for direct event handlers
  const transformRef = useRef<ImageTransform>(transform);
  transformRef.current = transform;

  const onUpdateSettingsRef = useRef(onUpdateSettings);
  onUpdateSettingsRef.current = onUpdateSettings;

  // When a new image is loaded, ensure selection is active and transform is initialized
  useEffect(() => {
    if (image && !settings.imageTransform) {
      const initial = computeInitialTransform(image.width, image.height, settings.fitMode);
      onUpdateSettings({ imageTransform: initial });
      setIsSelected(true);
    }
  }, [image, settings.fitMode]);

  // -------------------------------------------------------------
  // OVERFLOW BOUNDARY DETECTION (Printable vs Non-Printable)
  // -------------------------------------------------------------
  const isOverflowingLeft = transform.x < -0.2;
  const isOverflowingTop = transform.y < -0.2;
  const isOverflowingRight = (transform.x + transform.width) > 100.2;
  const isOverflowingBottom = (transform.y + transform.height) > 100.2;
  const isOverflowing = isOverflowingLeft || isOverflowingTop || isOverflowingRight || isOverflowingBottom;

  const overflowSides: string[] = [];
  if (isOverflowingLeft) overflowSides.push('Izquierda');
  if (isOverflowingRight) overflowSides.push('Derecha');
  if (isOverflowingTop) overflowSides.push('Superior');
  if (isOverflowingBottom) overflowSides.push('Inferior');

  // Measurements in real cm
  const { widthCm, heightCm, xCm, yCm } = transformToCentimeters(transform);

  // -------------------------------------------------------------
  // SIZE EDITING ACTIONS (Toolbar Buttons & Sliders)
  // -------------------------------------------------------------
  // Step-based scaling (e.g. +10% or -10%)
  const handleScaleStep = (factor: number) => {
    if (!image) return;
    const newTransform = scaleTransformByFactor(transform, factor, image.width, image.height);
    onUpdateSettings({ imageTransform: newTransform });
    setIsSelected(true);
  };

  // Direct scale percentage from slider
  const handleSliderScale = (targetWidthPercent: number) => {
    if (!image) return;
    const safeTarget = Math.max(5, Math.min(300, targetWidthPercent));
    const factor = safeTarget / (transform.width || 100);
    const newTransform = scaleTransformByFactor(transform, factor, image.width, image.height);
    onUpdateSettings({ imageTransform: newTransform });
    setIsSelected(true);
  };

  // Handler to apply predefined fit modes
  const handleApplyFitMode = (mode: FitMode) => {
    if (!image) return;
    const newTransform = computeInitialTransform(image.width, image.height, mode);
    onUpdateSettings({
      fitMode: mode,
      imageTransform: newTransform,
    });
    setIsSelected(true);
  };

  // Handler to center current image position horizontally and vertically
  const handleCenterImage = () => {
    if (!image) return;
    const centeredTransform: ImageTransform = {
      ...transform,
      x: Number(((100 - transform.width) / 2).toFixed(2)),
      y: Number(((100 - transform.height) / 2).toFixed(2)),
    };
    onUpdateSettings({ imageTransform: centeredTransform });
    setIsSelected(true);
  };

  // Handler to reset image transform to default
  const handleResetTransform = () => {
    if (!image) return;
    const resetTransform = computeInitialTransform(image.width, image.height, 'contain');
    onUpdateSettings({
      fitMode: 'contain',
      imageTransform: resetTransform,
    });
    setIsSelected(true);
  };

  // -------------------------------------------------------------
  // DIRECT POINTER DRAGGING (MOVE IMAGE)
  // -------------------------------------------------------------
  const handlePointerDownMove = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    if (!designAreaRef.current) return;
    const canvasRect = designAreaRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialTransform = { ...transformRef.current };

    setIsSelected(true);
    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Convert pixel deltas to canvas percentages
      const deltaXPercent = (deltaX / canvasRect.width) * 100;
      const deltaYPercent = (deltaY / canvasRect.height) * 100;

      const nextX = Number((initialTransform.x + deltaXPercent).toFixed(2));
      const nextY = Number((initialTransform.y + deltaYPercent).toFixed(2));

      onUpdateSettingsRef.current({
        imageTransform: {
          ...initialTransform,
          x: nextX,
          y: nextY,
        },
      });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      upEvent.preventDefault();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // -------------------------------------------------------------
  // DIRECT CORNER RESIZE (SCALE IMAGE PROPORTIONALLY)
  // -------------------------------------------------------------
  const handlePointerDownResize = (e: React.PointerEvent, handle: CornerHandle) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    if (!designAreaRef.current || !image) return;
    const canvasRect = designAreaRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialTransform = { ...transformRef.current };
    const imgAspect = (image.width || 1) / (image.height || 1);

    setIsSelected(true);
    setActiveResizeHandle(handle);

    const onPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;

      const initialW_px = (initialTransform.width / 100) * canvasRect.width;
      const initialH_px = (initialTransform.height / 100) * canvasRect.height;
      const initialLeft_px = (initialTransform.x / 100) * canvasRect.width;
      const initialTop_px = (initialTransform.y / 100) * canvasRect.height;

      let newW_px = initialW_px;
      let newH_px = initialH_px;
      let newLeft_px = initialLeft_px;
      let newTop_px = initialTop_px;

      const MIN_WIDTH_PX = 20;

      switch (handle) {
        case 'se': { // Bottom-Right: top-left anchor
          newW_px = Math.max(MIN_WIDTH_PX, initialW_px + deltaX);
          newH_px = newW_px / imgAspect;
          newLeft_px = initialLeft_px;
          newTop_px = initialTop_px;
          break;
        }
        case 'ne': { // Top-Right: bottom-left anchor
          newW_px = Math.max(MIN_WIDTH_PX, initialW_px + deltaX);
          newH_px = newW_px / imgAspect;
          newLeft_px = initialLeft_px;
          newTop_px = initialTop_px + (initialH_px - newH_px);
          break;
        }
        case 'sw': { // Bottom-Left: top-right anchor
          newW_px = Math.max(MIN_WIDTH_PX, initialW_px - deltaX);
          newH_px = newW_px / imgAspect;
          newLeft_px = initialLeft_px + (initialW_px - newW_px);
          newTop_px = initialTop_px;
          break;
        }
        case 'nw': { // Top-Left: bottom-right anchor
          newW_px = Math.max(MIN_WIDTH_PX, initialW_px - deltaX);
          newH_px = newW_px / imgAspect;
          newLeft_px = initialLeft_px + (initialW_px - newW_px);
          newTop_px = initialTop_px + (initialH_px - newH_px);
          break;
        }
      }

      const newWidth = Number(((newW_px / canvasRect.width) * 100).toFixed(2));
      const newHeight = Number(((newH_px / canvasRect.height) * 100).toFixed(2));
      const newX = Number(((newLeft_px / canvasRect.width) * 100).toFixed(2));
      const newY = Number(((newTop_px / canvasRect.height) * 100).toFixed(2));

      onUpdateSettingsRef.current({
        imageTransform: {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        },
      });
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      upEvent.preventDefault();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      setActiveResizeHandle(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  return (
    <div className="flex flex-col gap-3 w-full select-none">
      {/* Canvas Top Bar: Status and controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:px-4 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900 font-display flex items-center gap-1.5">
              Área de Sublimación Panorámica
              <span className="text-xs font-normal text-stone-500 hidden sm:inline">
                ({STANDARD_MUG_SPEC.printWidthCm} × {STANDARD_MUG_SPEC.printHeightCm} cm)
              </span>
            </h2>
          </div>
        </div>

        {/* Canvas Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Fit Mode & Alignment (Active when image exists) */}
          {image && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Size scale stepper (- / +) */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200/80" title="Editar tamaño de la imagen">
                <button
                  id="scale-down-btn"
                  type="button"
                  onClick={() => handleScaleStep(0.92)}
                  className="p-1.5 text-stone-600 hover:text-stone-950 hover:bg-white rounded transition-all cursor-pointer"
                  title="Reducir tamaño (-8%)"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="px-2 text-xs font-mono font-semibold text-stone-700 select-none flex items-center gap-1">
                  <Scaling className="w-3 h-3 text-indigo-600" />
                  <span>{widthCm} cm</span>
                </div>
                <button
                  id="scale-up-btn"
                  type="button"
                  onClick={() => handleScaleStep(1.08)}
                  className="p-1.5 text-stone-600 hover:text-stone-950 hover:bg-white rounded transition-all cursor-pointer"
                  title="Aumentar tamaño (+8%)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Fit presets */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200/80">
                <button
                  id="fit-contain-btn"
                  type="button"
                  onClick={() => handleApplyFitMode('contain')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    settings.fitMode === 'contain'
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Ajustar imagen dentro de los límites imprimibles"
                >
                  Ajustar
                </button>
                <button
                  id="fit-cover-btn"
                  type="button"
                  onClick={() => handleApplyFitMode('cover')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    settings.fitMode === 'cover'
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Llenar todo el lienzo (puede recortar en los bordes)"
                >
                  Llenar
                </button>
                <button
                  id="center-image-btn"
                  type="button"
                  onClick={handleCenterImage}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-stone-600 hover:text-stone-900 transition-all cursor-pointer"
                  title="Centrar en el área imprimible"
                >
                  <AlignCenter className="w-3 h-3 text-stone-500" />
                  <span>Centrar</span>
                </button>
                <button
                  id="reset-transform-btn"
                  type="button"
                  onClick={handleResetTransform}
                  className="p-1 text-stone-500 hover:text-stone-800 transition-all cursor-pointer"
                  title="Restablecer tamaño y posición original"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* View guides & rulers toggles */}
          <div className="flex items-center gap-1">
            <button
              id="toggle-guides-btn"
              type="button"
              onClick={() => onUpdateSettings({ showGuides: !settings.showGuides })}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                settings.showGuides
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
              title={settings.showGuides ? 'Ocultar guías de sublimación' : 'Mostrar guías de sublimación'}
            >
              {settings.showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Guías</span>
            </button>

            <button
              id="toggle-rulers-btn"
              type="button"
              onClick={() => onUpdateSettings({ showRulers: !settings.showRulers })}
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                settings.showRulers
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
              title="Mostrar u ocultar reglas métricas en centímetros"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reglas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Sublimation Boundary Status Notification Banner */}
      {image && (
        <div className="transition-all duration-200">
          {isOverflowing ? (
            <div 
              id="overflow-warning-banner" 
              className="flex items-center justify-between flex-wrap gap-2 px-3.5 py-2 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950 text-xs shadow-xs"
            >
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Diseño rebasa el área de impresión ({overflowSides.join(', ')}):</strong> La porción sombreada exterior se recortará al transferirse a la taza.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="auto-fit-btn"
                  type="button"
                  onClick={() => handleApplyFitMode('contain')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs"
                  title="Reducir y centrar la imagen para que quede 100% dentro"
                >
                  <Scissors className="w-3 h-3" />
                  <span>Ajustar al área imprimible</span>
                </button>
              </div>
            </div>
          ) : (
            <div 
              id="in-bounds-banner" 
              className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 text-xs shadow-xs"
            >
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Límites válidos:</strong> El 100% de la imagen está dentro del área de sublimación (20 × 9.5 cm).
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-medium">
                Sin recortes
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Design Canvas Area Wrapper / Extended Workspace */}
      <div 
        id="sublimation-stage" 
        className="relative bg-stone-900/5 rounded-2xl p-6 sm:p-8 md:p-10 border border-stone-200 overflow-hidden flex flex-col items-center justify-center min-h-[400px] sm:min-h-[460px] transition-all"
        style={{
          backgroundImage: `radial-gradient(#d6d3d1 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
        onClick={(e) => {
          // Clicking on the empty background deselects the image
          if (e.target === e.currentTarget) {
            setIsSelected(false);
          }
        }}
      >
        {/* Exterior Non-Printable Zone Label Watermarks (visible when image overflows) */}
        {image && isOverflowing && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-stone-800/85 text-stone-200 text-[10px] font-mono pointer-events-none z-10 flex items-center gap-1.5 shadow-sm">
            <Scissors className="w-3 h-3 text-amber-400" />
            <span>Zona exterior sombreada = Fuera de impresión</span>
          </div>
        )}

        {/* Horizontal Top Ruler (0 to 20 cm) */}
        {settings.showRulers && (
          <div className="w-full max-w-[840px] mb-1 px-8 select-none pointer-events-none">
            <div className="h-5 w-full flex justify-between items-end border-b border-stone-400/60 pb-0.5 text-[10px] font-mono text-stone-600">
              {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20].map((cm) => (
                <div key={cm} className="flex flex-col items-center">
                  <div className="h-1.5 w-px bg-stone-500"></div>
                  <span>{cm}cm</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* The Mug Template Frame with exact 20:9.5 aspect ratio */}
        <div 
          className="relative w-full max-w-[840px] rounded-lg"
          style={{
            transform: `scale(${settings.scale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Dimension badges above and left of the printable frame */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-medium text-stone-500 pointer-events-none">
            200 mm (20 cm)
          </div>
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-mono font-medium text-stone-500 pointer-events-none whitespace-nowrap">
            95 mm
          </div>

          {/* Printable Area Container Box (Aspect Ratio 200 / 95 = 2.105) */}
          <div 
            ref={designAreaRef}
            id="sublimation-design-area"
            className={`relative w-full rounded-lg transition-all ${
              image 
                ? 'shadow-xl' 
                : 'border-2 border-dashed border-stone-300 hover:border-indigo-400 hover:bg-stone-50/50 cursor-pointer'
            }`}
            style={{
              aspectRatio: '200 / 95',
            }}
            onClick={(e) => {
              if (!image) {
                onTriggerUpload();
              } else if (e.target === e.currentTarget) {
                setIsSelected(false);
              }
            }}
          >
            {/* Background Texture / Pure White Paper tint inside printable area */}
            <div className="absolute inset-0 bg-white rounded-lg pointer-events-none shadow-sm z-0" />

            {/* Sublimation Zone Columns (Left/Back, Center, Right/Front) */}
            {settings.showGuides && (
              <div className="absolute inset-0 grid grid-cols-3 pointer-events-none z-10">
                {/* Zone 1: Izquierda (Reverso) */}
                <div 
                  className="border-r border-indigo-400/40 relative pointer-events-none"
                  onMouseEnter={() => setActiveZoneTooltip('Lado Izquierdo (Reverso al sostener con mano derecha)')}
                  onMouseLeave={() => setActiveZoneTooltip(null)}
                >
                  <div className="absolute top-2 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-900/80 text-white backdrop-blur-xs pointer-events-none select-none">
                    Reverso / Izq
                  </div>
                  <div className="absolute bottom-2 left-3 text-[10px] font-mono text-stone-400 pointer-events-none select-none">
                    0 - 6.6 cm
                  </div>
                </div>

                {/* Zone 2: Centro (Frente Visible) */}
                <div 
                  className="border-r border-indigo-400/40 relative pointer-events-none"
                  onMouseEnter={() => setActiveZoneTooltip('Zona Central (Cara frontal opuesta al asa)')}
                  onMouseLeave={() => setActiveZoneTooltip(null)}
                >
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-900/80 text-white backdrop-blur-xs pointer-events-none select-none">
                    Centro Frontal
                  </div>
                  {/* Vertical Center Axis Line */}
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-indigo-400/60 pointer-events-none"></div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-stone-400 pointer-events-none select-none">
                    10 cm (Eje)
                  </div>
                </div>

                {/* Zone 3: Derecha (Frente) */}
                <div 
                  className="relative pointer-events-none"
                  onMouseEnter={() => setActiveZoneTooltip('Lado Derecho (Frente al sostener con mano derecha)')}
                  onMouseLeave={() => setActiveZoneTooltip(null)}
                >
                  <div className="absolute top-2 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-900/80 text-white backdrop-blur-xs pointer-events-none select-none">
                    Frente / Der
                  </div>
                  <div className="absolute bottom-2 right-3 text-[10px] font-mono text-stone-400 pointer-events-none select-none">
                    13.3 - 20 cm
                  </div>
                </div>
              </div>
            )}

            {/* Safe Margin Guide (5mm safe border) */}
            {settings.showGuides && (
              <div 
                className="absolute inset-[3.5%] border border-dashed border-amber-500/70 rounded pointer-events-none z-10"
                title="Margen de seguridad (5 mm del borde). Mantén textos y logotipos dentro de esta línea."
              >
                <div className="absolute bottom-1 right-2 px-1.5 py-0.5 bg-amber-500/90 text-white rounded text-[9px] font-mono font-medium">
                  Margen Seguro 5mm
                </div>
              </div>
            )}

            {/* Horizontal Center Guide */}
            {settings.showGuides && (
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-indigo-300/50 pointer-events-none z-10" />
            )}

            {/* Handle/Ear indicators on far edges */}
            <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-stone-400/40 to-transparent pointer-events-none z-10" title="Borde cercano al asa izquierda" />
            <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-l from-stone-400/40 to-transparent pointer-events-none z-10" title="Borde cercano al asa derecha" />

            {/* CONTENT LAYER: INTERACTIVE TRANSFORMABLE IMAGE (Allows overflow into surrounding workspace) */}
            {image ? (
              <div
                id="interactive-image-container"
                className={`absolute select-none ${
                  isSelected ? 'z-30' : 'z-20'
                }`}
                style={{
                  left: `${transform.x}%`,
                  top: `${transform.y}%`,
                  width: `${transform.width}%`,
                  height: `${transform.height}%`,
                  touchAction: 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelected(true);
                }}
              >
                {/* Visual Image Render & Move Handler */}
                <div
                  className={`relative w-full h-full group ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  onPointerDown={handlePointerDownMove}
                  title="Haz clic y arrastra para mover la imagen en el lienzo"
                >
                  <img
                    id="rendered-sublimation-image"
                    src={image.dataUrl}
                    alt={image.name}
                    draggable={false}
                    className="w-full h-full object-fill pointer-events-none select-none drop-shadow-xs"
                  />

                  {/* Active Selection Outline & Transformation Controls */}
                  {isSelected && (
                    <div 
                      id="selection-bounding-box"
                      className="absolute inset-0 border-2 border-indigo-600 ring-2 ring-indigo-500/25 pointer-events-none"
                    >
                      {/* Live Dimension & Position Pill */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-stone-900/90 text-white rounded-md text-[10px] font-mono font-semibold tracking-wide whitespace-nowrap shadow-md pointer-events-none flex items-center gap-1.5 z-40">
                        <Move className="w-2.5 h-2.5 text-indigo-400" />
                        <span>{widthCm} × {heightCm} cm</span>
                        <span className="text-stone-400">|</span>
                        <span className="text-stone-300">X: {xCm} Y: {yCm} cm</span>
                        {isOverflowing && (
                          <span className="ml-1 text-amber-300 font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Rebasa bordes
                          </span>
                        )}
                      </div>

                      {/* Top-Left Corner Handle (NW) - 32px touch target with 14px visual handle */}
                      <div
                        id="handle-nw"
                        className="absolute -top-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize pointer-events-auto group/handle z-50"
                        onPointerDown={(e) => handlePointerDownResize(e, 'nw')}
                        title="Arrastrar para cambiar el tamaño proporcionalmente"
                      >
                        <div className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs shadow-md group-hover/handle:scale-130 group-hover/handle:bg-indigo-50 group-hover/handle:border-indigo-700 transition-all"></div>
                      </div>

                      {/* Top-Right Corner Handle (NE) - 32px touch target with 14px visual handle */}
                      <div
                        id="handle-ne"
                        className="absolute -top-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize pointer-events-auto group/handle z-50"
                        onPointerDown={(e) => handlePointerDownResize(e, 'ne')}
                        title="Arrastrar para cambiar el tamaño proporcionalmente"
                      >
                        <div className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs shadow-md group-hover/handle:scale-130 group-hover/handle:bg-indigo-50 group-hover/handle:border-indigo-700 transition-all"></div>
                      </div>

                      {/* Bottom-Right Corner Handle (SE) - 32px touch target with 14px visual handle */}
                      <div
                        id="handle-se"
                        className="absolute -bottom-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize pointer-events-auto group/handle z-50"
                        onPointerDown={(e) => handlePointerDownResize(e, 'se')}
                        title="Arrastrar para cambiar el tamaño proporcionalmente"
                      >
                        <div className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs shadow-md group-hover/handle:scale-130 group-hover/handle:bg-indigo-50 group-hover/handle:border-indigo-700 transition-all"></div>
                      </div>

                      {/* Bottom-Left Corner Handle (SW) - 32px touch target with 14px visual handle */}
                      <div
                        id="handle-sw"
                        className="absolute -bottom-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize pointer-events-auto group/handle z-50"
                        onPointerDown={(e) => handlePointerDownResize(e, 'sw')}
                        title="Arrastrar para cambiar el tamaño proporcionalmente"
                      >
                        <div className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs shadow-md group-hover/handle:scale-130 group-hover/handle:bg-indigo-50 group-hover/handle:border-indigo-700 transition-all"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty State Placeholder */
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-indigo-100 transition-all shadow-xs border border-indigo-100">
                  <Maximize2 className="w-7 h-7 stroke-[1.8]" />
                </div>
                <h3 className="font-display font-bold text-base sm:text-lg text-stone-900 mb-1">
                  Área de Sublimación Imprimible
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-md mb-3">
                  Haz clic aquí o utiliza el botón <strong className="text-stone-700">"Cargar Imagen"</strong> para colocar tu diseño en la plantilla panorámica (20 × 9.5 cm).
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-white group-hover:bg-indigo-600 transition-colors shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Seleccionar archivo JPG o PNG
                </span>
              </div>
            )}

            {/* EXTERIOR BLEED SHADING MASK & CRISP PHYSICAL BOUNDARY */}
            {/* The 9999px box-shadow dims everything OUTSIDE the printable 20x9.5cm box */}
            <div
              id="sublimation-boundary-overlay"
              className={`absolute inset-0 rounded-lg pointer-events-none transition-colors z-25 ${
                isOverflowing 
                  ? 'border-2 border-amber-500/90 ring-1 ring-amber-400/40' 
                  : 'border-2 border-stone-800'
              }`}
              style={{
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)',
              }}
            >
              {/* Professional L-shaped Corner Crop Marks */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-stone-800 pointer-events-none" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-stone-800 pointer-events-none" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-stone-800 pointer-events-none" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-stone-800 pointer-events-none" />

              {/* Exterior Warning Pill attached to top border when overflowing */}
              {image && isOverflowing && (
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-amber-500 text-stone-950 font-bold text-[9px] rounded uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <Scissors className="w-2.5 h-2.5" />
                  <span>Límite de corte</span>
                </div>
              )}
            </div>

          </div>

          {/* Dimension Label Footnote */}
          <div className="flex items-center justify-between mt-3 px-1 text-[11px] text-stone-500 font-mono">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isOverflowing ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              <span>Área imprimible estándar: 200 mm × 95 mm (11 oz)</span>
            </div>
            <div className="flex items-center gap-3">
              {image && isSelected ? (
                <span className="text-indigo-600 font-medium">
                  Controles de transformación activos
                </span>
              ) : image ? (
                <button
                  type="button"
                  onClick={() => setIsSelected(true)}
                  className="text-stone-600 hover:text-indigo-600 cursor-pointer underline"
                >
                  Haz clic en la imagen para seleccionarla y editarla
                </button>
              ) : (
                <span className="font-semibold text-stone-700">Escala 1:1</span>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Zone Tooltip / Notification */}
        {activeZoneTooltip && (
          <div className="mt-3 px-3 py-1 bg-stone-900 text-white text-xs rounded-full font-medium shadow-lg animate-fade-in flex items-center gap-1.5 z-20">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>{activeZoneTooltip}</span>
          </div>
        )}
      </div>

      {/* Direct Size Slider & Quick Action Control Bar (Visible when image is loaded) */}
      {image && (
        <div id="image-size-controls-bar" className="bg-white rounded-xl border border-stone-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium text-stone-700">
            <Scaling className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Tamaño del diseño:</span>
            <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              {widthCm} × {heightCm} cm
            </span>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-sm min-w-[200px]">
            <button
              id="slider-minus-btn"
              type="button"
              onClick={() => handleScaleStep(0.9)}
              className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors cursor-pointer"
              title="Disminuir tamaño (-10%)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <input
              id="image-scale-slider"
              type="range"
              min="10"
              max="250"
              step="1"
              value={Math.round(transform.width)}
              onChange={(e) => handleSliderScale(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
              title="Desliza para cambiar el tamaño libremente"
            />

            <button
              id="slider-plus-btn"
              type="button"
              onClick={() => handleScaleStep(1.1)}
              className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors cursor-pointer"
              title="Aumentar tamaño (+10%)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            
            <span className="font-mono text-stone-500 text-[11px] min-w-[36px] text-right">
              {Math.round(transform.width)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyFitMode('contain')}
              className="px-2.5 py-1 text-stone-700 hover:text-indigo-600 hover:bg-indigo-50 border border-stone-200 rounded-md transition-all font-medium cursor-pointer"
            >
              Ajustar (100%)
            </button>
            <button
              type="button"
              onClick={() => handleApplyFitMode('cover')}
              className="px-2.5 py-1 text-stone-700 hover:text-indigo-600 hover:bg-indigo-50 border border-stone-200 rounded-md transition-all font-medium cursor-pointer"
            >
              Llenar marco
            </button>
            <button
              type="button"
              onClick={handleCenterImage}
              className="px-2.5 py-1 text-stone-700 hover:text-indigo-600 hover:bg-indigo-50 border border-stone-200 rounded-md transition-all font-medium cursor-pointer"
            >
              Centrar
            </button>
          </div>
        </div>
      )}

      {/* Guide Legend Bar and Quick Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-1 py-1 text-xs text-stone-600">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-200">
          <span className="w-3.5 h-3.5 rounded-xs bg-white border-2 border-stone-800 shrink-0"></span>
          <span><strong>Área válida (Blanca):</strong> Se transfiere íntegra a la taza</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-200">
          <span className="w-3.5 h-3.5 rounded-xs bg-stone-800/40 border border-stone-400 shrink-0"></span>
          <span><strong>Zona sombreada (Exterior):</strong> Queda fuera y se recorta</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-200">
          <Scissors className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span><strong>Límite 20×9.5 cm:</strong> Borde exacto de impresión</span>
        </div>
      </div>
    </div>
  );
};
