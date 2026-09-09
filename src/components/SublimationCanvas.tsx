import React, { useState } from 'react';
import { 
  Maximize2, 
  Eye, 
  EyeOff, 
  Grid3X3, 
  Sliders, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Info
} from 'lucide-react';
import { UploadedImage, DesignCanvasSettings, STANDARD_MUG_SPEC } from '../types';

interface SublimationCanvasProps {
  image: UploadedImage | null;
  settings: DesignCanvasSettings;
  onUpdateSettings: (settings: Partial<DesignCanvasSettings>) => void;
  onTriggerUpload: () => void;
}

export const SublimationCanvas: React.FC<SublimationCanvasProps> = ({
  image,
  settings,
  onUpdateSettings,
  onTriggerUpload,
}) => {
  const [activeZoneTooltip, setActiveZoneTooltip] = useState<string | null>(null);

  // Quick helper for fit styles
  const getImageObjectFit = () => {
    switch (settings.fitMode) {
      case 'cover':
        return 'object-cover';
      case 'stretch':
        return 'object-fill';
      case 'original':
        return 'object-none';
      case 'contain':
      default:
        return 'object-contain';
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
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
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Fit Mode Selector (Active only when image exists) */}
          {image && (
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200/80 mr-1">
              <button
                id="fit-contain-btn"
                type="button"
                onClick={() => onUpdateSettings({ fitMode: 'contain' })}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  settings.fitMode === 'contain'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Ajustar imagen completa manteniendo proporciones"
              >
                Ajustar
              </button>
              <button
                id="fit-cover-btn"
                type="button"
                onClick={() => onUpdateSettings({ fitMode: 'cover' })}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  settings.fitMode === 'cover'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Llenar todo el lienzo (puede recortar bordes)"
              >
                Llenar
              </button>
              <button
                id="fit-stretch-btn"
                type="button"
                onClick={() => onUpdateSettings({ fitMode: 'stretch' })}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  settings.fitMode === 'stretch'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Estirar a las dimensiones exactas de la plantilla"
              >
                Estirar
              </button>
            </div>
          )}

          {/* Toggle Guides */}
          <button
            id="toggle-guides-btn"
            type="button"
            onClick={() => onUpdateSettings({ showGuides: !settings.showGuides })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              settings.showGuides
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
            title={settings.showGuides ? 'Ocultar guías de sublimación' : 'Mostrar guías de sublimación'}
          >
            {settings.showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Guías</span>
          </button>

          {/* Toggle Rulers */}
          <button
            id="toggle-rulers-btn"
            type="button"
            onClick={() => onUpdateSettings({ showRulers: !settings.showRulers })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
              settings.showRulers
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
            title="Mostrar u ocultar reglas métricas en centímetros"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reglas</span>
          </button>

          {/* Zoom controls for canvas inspection */}
          <div className="hidden lg:flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200/80">
            <button
              id="zoom-out-btn"
              type="button"
              disabled={settings.scale <= 0.8}
              onClick={() => onUpdateSettings({ scale: Math.max(0.8, settings.scale - 0.1) })}
              className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Alejar vista del área"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono font-medium text-stone-600">
              {Math.round(settings.scale * 100)}%
            </span>
            <button
              id="zoom-in-btn"
              type="button"
              disabled={settings.scale >= 1.4}
              onClick={() => onUpdateSettings({ scale: Math.min(1.4, settings.scale + 0.1) })}
              className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Acercar vista del área"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {settings.scale !== 1.0 && (
              <button
                type="button"
                onClick={() => onUpdateSettings({ scale: 1.0 })}
                className="px-1 text-[10px] text-indigo-600 hover:underline cursor-pointer font-medium"
                title="Restablecer zoom a 100%"
              >
                1:1
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Design Canvas Area Wrapper */}
      <div 
        id="sublimation-stage" 
        className="relative bg-stone-900/5 rounded-2xl p-4 sm:p-6 md:p-8 border border-stone-200 overflow-hidden flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px] transition-all"
        style={{
          backgroundImage: `radial-gradient(#d6d3d1 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      >
        {/* Horizontal Top Ruler (0 to 20 cm) */}
        {settings.showRulers && (
          <div className="w-full max-w-[840px] mb-1 px-8 select-none">
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
          className="relative w-full max-w-[840px] transition-transform duration-200 ease-out shadow-xl rounded-lg"
          style={{
            transform: `scale(${settings.scale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Canvas Box (Aspect Ratio 200 / 95 = 2.105) */}
          <div 
            id="sublimation-design-area"
            className={`relative w-full bg-white rounded-lg border-2 transition-all overflow-hidden ${
              image 
                ? 'border-indigo-600/60 shadow-md ring-4 ring-indigo-500/10' 
                : 'border-dashed border-stone-300 hover:border-indigo-400 hover:bg-stone-50/50 cursor-pointer'
            }`}
            style={{
              aspectRatio: '200 / 95',
            }}
            onClick={() => {
              if (!image) {
                onTriggerUpload();
              }
            }}
          >
            {/* Background Texture/Paper tint */}
            <div className="absolute inset-0 bg-[#ffffff]" />

            {/* Sublimation Zone Columns (Left/Back, Center, Right/Front) */}
            {settings.showGuides && (
              <div className="absolute inset-0 grid grid-cols-3 pointer-events-none z-10">
                {/* Zone 1: Izquierda (Reverso) */}
                <div 
                  className="border-r border-indigo-400/40 relative group"
                  onMouseEnter={() => setActiveZoneTooltip('Lado Izquierdo (Reverso al sostener con mano derecha)')}
                  onMouseLeave={() => setActiveZoneTooltip(null)}
                >
                  <div className="absolute top-2 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-900/80 text-white backdrop-blur-xs">
                    Reverso / Izq
                  </div>
                  <div className="absolute bottom-2 left-3 text-[10px] font-mono text-stone-400">
                    0 - 6.6 cm
                  </div>
                </div>

                {/* Zone 2: Centro (Frente Visible) */}
                <div 
                  className="border-r border-indigo-400/40 relative"
                  onMouseEnter={() => setActiveZoneTooltip('Zona Central (Cara frontal opuesta al asa)')}
                  onMouseLeave={() => setActiveZoneTooltip(null)}
                >
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-900/80 text-white backdrop-blur-xs">
                    Centro Frontal
                  </div>
                  {/* Vertical Center Axis Line */}
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l border-dashed border-indigo-400/60"></div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-stone-400">
                    10 cm (Eje)
                  </div>
                </div>

                {/* Zone 3: Derecha (Frente) */}
                <div 
                  className="relative"
                  onMouseEnter={() => setActiveZoneTooltip('Lado Derecho (Frente al sostener con mano derecha)')}
                  onMouseLeave={() => setActiveZoneTooltip(null)}
                >
                  <div className="absolute top-2 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-900/80 text-white backdrop-blur-xs">
                    Frente / Der
                  </div>
                  <div className="absolute bottom-2 right-3 text-[10px] font-mono text-stone-400">
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

            {/* CONTENT LAYER */}
            {image ? (
              <div className="absolute inset-0 flex items-center justify-center p-0 overflow-hidden">
                <img
                  id="rendered-sublimation-image"
                  src={image.dataUrl}
                  alt={image.name}
                  className={`w-full h-full select-none transition-all duration-150 ${getImageObjectFit()}`}
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))',
                  }}
                />
              </div>
            ) : (
              /* Empty State Placeholder */
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-indigo-100 transition-all shadow-xs border border-indigo-100">
                  <Maximize2 className="w-7 h-7 stroke-[1.8]" />
                </div>
                <h3 className="font-display font-bold text-base sm:text-lg text-stone-900 mb-1">
                  Área de Diseño de la Taza
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

            {/* Handle/Ear indicators on far edges */}
            <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-stone-400/40 to-transparent pointer-events-none" title="Borde cercano al asa izquierda" />
            <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-l from-stone-400/40 to-transparent pointer-events-none" title="Borde cercano al asa derecha" />
          </div>

          {/* Dimension Label Footnote */}
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-stone-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Plantilla estándar 11 oz: 200 mm × 95 mm</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Resolución recomendada: 2362 × 1122 px (300 DPI)</span>
              <span className="font-semibold text-stone-700">Escala 1:1</span>
            </div>
          </div>
        </div>

        {/* Interactive Zone Tooltip / Notification */}
        {activeZoneTooltip && (
          <div className="mt-3 px-3 py-1 bg-stone-900 text-white text-xs rounded-full font-medium shadow-lg animate-fade-in flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>{activeZoneTooltip}</span>
          </div>
        )}
      </div>

      {/* Guide Legend Bar */}
      {settings.showGuides && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-1 py-1 text-xs text-stone-600">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-200">
            <span className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-400 inline-block"></span>
            <span><strong>Zonas de Taza:</strong> Reverso, Centro y Frente</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-200">
            <span className="w-3 h-3 rounded-xs border-2 border-dashed border-amber-500 inline-block"></span>
            <span><strong>Margen Seguro:</strong> 5 mm (evita textos al borde)</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-200">
            <span className="w-3 h-3 bg-stone-300 inline-block"></span>
            <span><strong>Separación Asa:</strong> ~2.5 cm sin impresión</span>
          </div>
        </div>
      )}
    </div>
  );
};
