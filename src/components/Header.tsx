import React from 'react';
import { Sparkles, Layers, Image as ImageIcon, Box, RotateCcw } from 'lucide-react';

interface HeaderProps {
  hasImage: boolean;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ hasImage, onReset }) => {
  return (
    <header id="app-header" className="bg-white border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand & Product context */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-stone-900">
                  SubliStudio
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  MVP • Taza 11 oz
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium hidden sm:block">
                Configurador de personalización para sublimación
              </p>
            </div>
          </div>

          {/* Stepper Workflow (Shows context clearly without adding out-of-scope functional screens) */}
          <div className="hidden md:flex items-center gap-2 bg-stone-100/80 p-1.5 rounded-xl border border-stone-200/80 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-white text-stone-900 shadow-xs border border-stone-200/60">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Cargar diseño</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-stone-400 select-none" title="Próximamente en el siguiente sprint">
              <Layers className="w-3.5 h-3.5" />
              <span>2. Acomodar</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-stone-400 select-none" title="Próximamente en el siguiente sprint">
              <Box className="w-3.5 h-3.5" />
              <span>3. Vista 3D</span>
            </div>
          </div>

          {/* Action Header Items */}
          <div className="flex items-center gap-3">
            {hasImage && (
              <button
                id="header-reset-btn"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 rounded-lg transition-colors cursor-pointer"
                title="Limpiar imagen actual y volver a empezar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Empezar de nuevo</span>
                <span className="sm:hidden">Reiniciar</span>
              </button>
            )}

            <div className="flex items-center gap-2 text-right">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-medium text-stone-600 hidden lg:inline">
                Área de impresión: 20 × 9.5 cm
              </span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
