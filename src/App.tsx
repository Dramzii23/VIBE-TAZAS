import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { SublimationCanvas } from './components/SublimationCanvas';
import { UploadSection } from './components/UploadSection';
import { MugPreviewCard } from './components/MugPreviewCard';
import { SpecsCard } from './components/SpecsCard';
import { UploadedImage, DesignCanvasSettings } from './types';
import { ArrowRight, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  // State for the uploaded image
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

  // State for canvas view settings
  const [canvasSettings, setCanvasSettings] = useState<DesignCanvasSettings>({
    fitMode: 'contain',
    showGuides: true,
    showRulers: true,
    showZones: true,
    scale: 1.0,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    backgroundColor: '#ffffff',
  });

  // Reference to file input inside UploadSection
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdateSettings = (partial: Partial<DesignCanvasSettings>) => {
    setCanvasSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setUploadedImage(null);
    setCanvasSettings((prev) => ({
      ...prev,
      fitMode: 'contain',
      scale: 1.0,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <Header hasImage={!!uploadedImage} onReset={handleReset} />

      {/* Main Container */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">
        
        {/* Hero / Context Title Bar */}
        <section id="hero-banner" className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-stone-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Configurador de Sublimación • Ticket #1: Carga de Imagen</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-stone-950 tracking-tight">
              Personaliza tu Taza de Cerámica (11 oz)
            </h1>
            <p className="text-sm sm:text-base text-stone-600 max-w-2xl mt-1">
              Carga tu diseño o fotografía en formato <strong>JPG o PNG</strong>. El diseño se reflejará inmediatamente en el área de sublimación de 20 × 9.5 cm.
            </p>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              uploadedImage 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-stone-100 text-stone-700 border-stone-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${uploadedImage ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`}></span>
              <span>{uploadedImage ? 'Imagen cargada en el lienzo' : 'Esperando diseño...'}</span>
            </div>
          </div>
        </section>

        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Sublimation Canvas & Design Area (7 cols on large screens) */}
          <div className="lg:col-span-7 flex flex-col gap-6 order-2 lg:order-1">
            <SublimationCanvas
              image={uploadedImage}
              settings={canvasSettings}
              onUpdateSettings={handleUpdateSettings}
              onTriggerUpload={handleTriggerUpload}
            />

            {/* Sublimation Pro-Tips info box */}
            <div className="bg-stone-100/70 rounded-2xl p-4 sm:p-5 border border-stone-200 text-xs sm:text-sm text-stone-600 flex flex-col gap-2.5">
              <h4 className="font-display font-semibold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                ¿Cómo funciona la plantilla de sublimación?
              </h4>
              <p className="leading-relaxed text-stone-600">
                La plantilla representa el desarrollo plano de una taza cilíndrica de 11 oz. La zona central quedará en el frente opuesto al asa, mientras que los extremos izquierdo y derecho corresponden a las vistas laterales visible al sujetar la taza.
              </p>
              <div className="flex flex-wrap gap-4 pt-1 font-mono text-xs text-stone-500">
                <span>• Ancho: 200 mm (20 cm)</span>
                <span>• Alto: 95 mm (9.5 cm)</span>
                <span>• Margen de seguridad recomendado: 5 mm</span>
              </div>
            </div>
          </div>

          {/* Right Column: Upload Controls & Previews (5 cols on large screens) */}
          <div className="lg:col-span-5 flex flex-col gap-6 order-1 lg:order-2">
            
            {/* 1. Upload Section with Drag & Drop and Feedback */}
            <UploadSection
              currentImage={uploadedImage}
              onImageLoaded={(img) => setUploadedImage(img)}
              onRemoveImage={() => setUploadedImage(null)}
              fileInputRef={fileInputRef}
            />

            {/* 2. Mug 2D Silhouette Preview */}
            <MugPreviewCard image={uploadedImage} />

            {/* 3. Product Specs & Sublimation Details */}
            <SpecsCard />

          </div>

        </div>

      </main>

      {/* Simple, clean footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Configurador de Sublimación MVP — Cerámica 11 oz</span>
          <span className="text-stone-400">Formatos admitidos: JPG, PNG • Carga instantánea en cliente</span>
        </div>
      </footer>
    </div>
  );
}
