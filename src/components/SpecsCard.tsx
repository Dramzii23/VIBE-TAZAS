import React from 'react';
import { Layers, ShieldCheck, CheckCircle2, Ruler, Printer } from 'lucide-react';
import { STANDARD_MUG_SPEC } from '../types';

export const SpecsCard: React.FC = () => {
  return (
    <div id="product-specs-card" className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-sm text-stone-900 flex items-center gap-2">
          <Printer className="w-4 h-4 text-indigo-600" />
          Ficha Técnica de Sublimación
        </h3>
        <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          Estándar 11 oz
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
          <span className="text-stone-500 block text-[11px]">Área imprimible</span>
          <span className="font-semibold text-stone-900 font-mono text-xs">
            {STANDARD_MUG_SPEC.printWidthCm} × {STANDARD_MUG_SPEC.printHeightCm} cm
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
          <span className="text-stone-500 block text-[11px]">Resolución ideal</span>
          <span className="font-semibold text-stone-900 font-mono text-xs">
            300 DPI (2362 × 1122 px)
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
          <span className="text-stone-500 block text-[11px]">Material</span>
          <span className="font-semibold text-stone-900 truncate block">
            Cerámica blanca brillante
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
          <span className="text-stone-500 block text-[11px]">Margen de seguridad</span>
          <span className="font-semibold text-stone-900 font-mono text-xs">
            5 mm en los 4 bordes
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Apta para microondas y lavavajillas
        </span>
        <span className="font-mono text-stone-400">Capacidad: 325 ml</span>
      </div>
    </div>
  );
};
