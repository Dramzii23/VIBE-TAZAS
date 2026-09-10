import React, { useState } from 'react';
import { Coffee, RotateCw, Sparkles, Check, Info } from 'lucide-react';
import { UploadedImage, STANDARD_MUG_SPEC, ImageTransform } from '../types';
import { computeInitialTransform } from '../utils/transformUtils';

interface MugPreviewCardProps {
  image: UploadedImage | null;
  transform?: ImageTransform | null;
}

export const MugPreviewCard: React.FC<MugPreviewCardProps> = ({ image, transform }) => {
  // Angle view selector: Front view (Frente), Center view, or Back view (Reverso)
  const [viewAngle, setViewAngle] = useState<'front' | 'center' | 'back'>('front');

  // Compute safe transform
  const safeTransform: ImageTransform = transform || (image
    ? computeInitialTransform(image.width, image.height, 'contain')
    : { x: 0, y: 0, width: 100, height: 100 }
  );

  // Offset the panoramic 300% band according to view angle
  const getPanoramicLeftOffset = () => {
    switch (viewAngle) {
      case 'back':
        return '0%';
      case 'center':
        return '-100%';
      case 'front':
      default:
        return '-200%';
    }
  };

  return (
    <div id="mug-preview-card" className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
            <Coffee className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-stone-900">
              Previsualización de la Taza
            </h3>
            <p className="text-[11px] text-stone-500">
              Simulación 2D de cara frontal / lateral
            </p>
          </div>
        </div>

        {/* Perspective Angle Switcher */}
        <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200/80 text-[11px]">
          <button
            id="view-front-btn"
            type="button"
            onClick={() => setViewAngle('front')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              viewAngle === 'front'
                ? 'bg-white font-semibold text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Frente
          </button>
          <button
            id="view-center-btn"
            type="button"
            onClick={() => setViewAngle('center')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              viewAngle === 'center'
                ? 'bg-white font-semibold text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Centro
          </button>
          <button
            id="view-back-btn"
            type="button"
            onClick={() => setViewAngle('back')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              viewAngle === 'back'
                ? 'bg-white font-semibold text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Reverso
          </button>
        </div>
      </div>

      {/* Realistic 2D Ceramic Mug Mockup Container */}
      <div className="relative w-full h-56 sm:h-64 bg-stone-50 rounded-xl border border-stone-200/70 flex items-center justify-center p-4 overflow-hidden select-none">
        
        {/* Subtle drop shadow below mug */}
        <div className="absolute bottom-6 w-36 sm:w-44 h-5 bg-stone-400/25 rounded-[100%] blur-sm pointer-events-none"></div>

        {/* Mug Composite Graphic */}
        <div className="relative flex items-center justify-center">
          {/* Ceramic Handle (Asa) on the left or right based on angle */}
          {viewAngle === 'front' && (
            <div 
              className="absolute -right-7 sm:-right-8 top-6 w-10 sm:w-12 h-28 sm:h-32 rounded-r-3xl border-8 sm:border-[10px] border-stone-200 bg-transparent z-0 shadow-sm"
              style={{
                borderColor: '#e7e5e4',
              }}
            />
          )}

          {viewAngle === 'back' && (
            <div 
              className="absolute -left-7 sm:-left-8 top-6 w-10 sm:w-12 h-28 sm:h-32 rounded-l-3xl border-8 sm:border-[10px] border-stone-200 bg-transparent z-0 shadow-sm"
              style={{
                borderColor: '#e7e5e4',
              }}
            />
          )}

          {/* Mug Ceramic Body Cylinder */}
          <div 
            className="relative w-36 sm:w-44 h-40 sm:h-48 rounded-b-2xl bg-white border-2 border-stone-200 shadow-lg z-10 overflow-hidden flex flex-col justify-between"
            style={{
              background: 'linear-gradient(90deg, #f5f5f4 0%, #ffffff 25%, #ffffff 75%, #f5f5f4 100%)',
            }}
          >
            {/* Top Rim of the Mug */}
            <div className="w-full h-3 bg-stone-100 border-b border-stone-200 rounded-t-full shadow-inner relative">
              <div className="absolute inset-x-2 top-0.5 h-1.5 bg-stone-200/50 rounded-full"></div>
            </div>

            {/* Sublimation Printable Band Applied on the Mug */}
            <div className="relative w-full h-[78%] my-auto overflow-hidden bg-white border-y border-stone-200/50 flex items-center justify-center">
              {image ? (
                <div 
                  className="absolute top-0 bottom-0 transition-all duration-300 pointer-events-none"
                  style={{
                    width: '300%',
                    left: getPanoramicLeftOffset(),
                  }}
                >
                  <div
                    className="absolute"
                    style={{
                      left: `${safeTransform.x}%`,
                      top: `${safeTransform.y}%`,
                      width: `${safeTransform.width}%`,
                      height: `${safeTransform.height}%`,
                    }}
                  >
                    <img
                      src={image.dataUrl}
                      alt="Diseño en taza"
                      className="w-full h-full object-fill pointer-events-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center p-3 opacity-60">
                  <div className="w-8 h-8 rounded-full border border-dashed border-stone-400 mx-auto mb-1 flex items-center justify-center text-stone-400">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-medium text-stone-400 block">
                    Sin imagen cargada
                  </span>
                </div>
              )}

              {/* Cylindrical lighting overlay to give true curved ceramic sheen */}
              <div 
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(255,255,255,0.4) 20%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.08) 100%)',
                }}
              />
            </div>

            {/* Bottom Base Rim */}
            <div className="w-full h-2.5 bg-stone-100 border-t border-stone-200 rounded-b-xl shadow-inner"></div>
          </div>
        </div>

        {/* Floating Perspective Badge */}
        <div className="absolute bottom-2.5 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-xs rounded-full border border-stone-200 text-[10px] font-medium text-stone-600 shadow-xs flex items-center gap-1">
          <span>Vista:</span>
          <strong className="text-stone-900 capitalize">
            {viewAngle === 'front' ? 'Frente (Diestro)' : viewAngle === 'center' ? 'Centro Opuesto' : 'Reverso'}
          </strong>
        </div>
      </div>

      {/* Note about 3D feature planned in next sprint */}
      <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 text-xs text-stone-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-stone-800">Nota del proyecto:</span> El modelo interactivo 3D completo, cotización y pedidos se integrarán en los siguientes tickets del MVP.
        </div>
      </div>
    </div>
  );
};
