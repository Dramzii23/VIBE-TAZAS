import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SublimationCanvas } from './components/SublimationCanvas';
import { UploadSection } from './components/UploadSection';
import { MugPreviewCard } from './components/MugPreviewCard';
import { Mug3DViewer } from './components/Mug3DViewer';
import { SpecsCard } from './components/SpecsCard';
import { BackendStatusCard } from './components/BackendStatusCard';
import { AuthModal } from './components/AuthModal';
import { CloudDesignsModal } from './components/CloudDesignsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { WhatsAppOrderModal } from './components/WhatsAppOrderModal';
import { UploadedImage, DesignCanvasSettings, isUserAdmin } from './types';
import { SavedCloudDesign } from './services/designStorage';
import { computeInitialTransformByDpi, DpiMode } from './utils/transformUtils';
import { loadSavedDraft, saveDraftLocally, clearSavedDraft } from './services/draftStorage';
import { useAuth } from './context/AuthContext';
import { CheckCircle2, Sparkles, Cloud, UserCheck, ShieldAlert, Gauge, FileText } from 'lucide-react';

export default function App() {
  const { user, profile, loading } = useAuth();
  const isAdmin = isUserAdmin(user?.uid, user?.email, profile?.role);

  // Initialize admin view mode based on auth state - use lazy initializer
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'editor'>(() => {
    // This only runs once on mount, so it will be 'editor' initially
    return 'editor';
  });

  // Set correct view exactly once after auth resolves — no deps on isAdmin to avoid loops
  const hasSetInitialView = useRef(false);
  useEffect(() => {
    if (loading) return;
    if (hasSetInitialView.current) return;
    hasSetInitialView.current = true;
    setAdminViewMode(isUserAdmin(user?.uid, user?.email, profile?.role) ? 'admin' : 'editor');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]); // intentionally only [loading] — runs once when auth finishes

  // State for the uploaded image
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

  // DPI mode for image placement
  const [dpiMode, setDpiMode] = useState<DpiMode>(300);

  // Interior color of the mug
  const [insideColor, setInsideColor] = useState<string>('#ffffff');

  // Preview mode (3D GLB model by default, or 2D silhouette simulation)
  const [previewMode, setPreviewMode] = useState<'3d' | '2d'>('3d');

  // Modals state
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

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

  // Track draft load on initial mount
  const hasLoadedDraft = useRef(false);
  useEffect(() => {
    if (hasLoadedDraft.current) return;
    hasLoadedDraft.current = true;
    const draft = loadSavedDraft();
    if (draft && draft.image) {
      setUploadedImage(draft.image);
      setCanvasSettings(draft.canvasSettings);
      setDpiMode(draft.dpiMode);
      if (draft.insideColor) {
        setInsideColor(draft.insideColor);
      }
    }
  }, []);

  // Save changes to localStorage draft with debouncing
  useEffect(() => {
    if (!hasLoadedDraft.current) return;
    const timer = setTimeout(() => {
      saveDraftLocally(uploadedImage, canvasSettings, dpiMode, insideColor);
    }, 400);
    return () => clearTimeout(timer);
  }, [uploadedImage, canvasSettings, dpiMode, insideColor]);

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
      imageTransform: null,
    }));
    clearSavedDraft();
  };

  const handleImageLoaded = (img: UploadedImage) => {
    setUploadedImage(img);
    const initial = computeInitialTransformByDpi(img.width, img.height, dpiMode);
    setCanvasSettings((prev) => ({
      ...prev,
      imageTransform: initial,
    }));
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLoadCloudDesign = useCallback((design: SavedCloudDesign) => {
    const loadedImg: UploadedImage = {
      id: design.id,
      name: design.imageName,
      dataUrl: design.dataUrl,
      sizeBytes: 100000,
      sizeFormatted: design.dimensions?.sizeFormatted || 'Guardado',
      width: design.dimensions?.width || 2000,
      height: design.dimensions?.height || 950,
      aspectRatio: (design.dimensions?.width || 2000) / (design.dimensions?.height || 950),
      dpiRating: 'optima',
      dpiRatingText: 'Diseño cargado desde Firebase Firestore',
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setUploadedImage(loadedImg);
    setCanvasSettings((prev) => ({
      ...prev,
      fitMode: design.fitMode || 'contain',
    }));
    // If loaded from admin panel, open editor
    if (adminViewMode === 'admin') {
      setAdminViewMode('editor');
    }
  }, [adminViewMode]);

  const handleSwitchToEditor = useCallback(() => {
    setAdminViewMode('editor');
  }, []);

  const isShowingAdminDashboard = isAdmin && adminViewMode === 'admin';

  // Show a clean loading screen while Firebase resolves to avoid any flash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-stone-500 font-medium">Cargando configurador...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <Header
        hasImage={!!uploadedImage}
        onReset={handleReset}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenAuth={handleOpenAuth}
        isAdmin={isAdmin}
        isAdminViewActive={isShowingAdminDashboard}
        onToggleAdminView={() => setAdminViewMode((prev) => (prev === 'admin' ? 'editor' : 'admin'))}
      />

      {/* Main Container */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">
        {isShowingAdminDashboard ? (
          /* ADMIN VIEW */
          <AdminDashboard
            onSelectDesignForEditor={handleLoadCloudDesign}
            onSwitchToEditor={handleSwitchToEditor}
          />
        ) : (
          /* NORMAL PERSONAL DASHBOARD & CONFIGURATOR */
          <>
            {/* If admin is viewing normal dashboard, offer quick return banner */}
            {isAdmin && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Estás visualizando el configurador con permisos de Super Admin.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminViewMode('admin')}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Volver al Panel Admin
                </button>
              </div>
            )}

            {/* Hero / Context Title Bar */}
            <section id="hero-banner" className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-stone-200/80">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 mb-2">
                  <img src="/assets/logo-malatinta.png" alt="" className="w-4 h-4 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                  <span>MalaTinta Studio • Taza Cerámica 11 oz</span>
                </div>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-stone-950 tracking-tight">
                  Personaliza tu Taza de Cerámica (11 oz)
                </h1>
                <p className="text-sm sm:text-base text-stone-600 max-w-2xl mt-1">
                  Carga tu diseño o fotografía en formato <strong>JPG o PNG</strong>. El diseño se reflejará inmediatamente en el área de sublimación de 20 × 9.5 cm.
                </p>
              </div>

              {/* Quick status actions */}
              <div className="flex flex-wrap items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{profile?.displayName || user.email}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenAuth('register')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-indigo-600 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Crear cuenta</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCloudModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-xs cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Diseños en Nube</span>
                </button>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  uploadedImage 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${uploadedImage ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`}></span>
                  <span>{uploadedImage ? 'Lienzo listo' : 'Esperando imagen...'}</span>
                </div>
              </div>
            </section>

            {/* Main 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Sublimation Canvas & Design Area */}
              <div className="lg:col-span-7 flex flex-col gap-6 order-2 lg:order-1">
                <SublimationCanvas
                  image={uploadedImage}
                  settings={canvasSettings}
                  onUpdateSettings={handleUpdateSettings}
                  onTriggerUpload={handleTriggerUpload}
                />

                {/* DPI / Resolution Selector — below the canvas */}
                <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span className="text-xs font-semibold text-stone-900">Resolución de impresión</span>
                    <span className="text-[10px] text-stone-400 ml-auto">Afecta el tamaño físico al colocar la imagen</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 72 as DpiMode, label: '72 DPI', quality: 'Baja', color: 'rose' },
                      { value: 150 as DpiMode, label: '150 DPI', quality: 'Media', color: 'amber' },
                      { value: 300 as DpiMode, label: '300 DPI', quality: 'Alta', color: 'emerald' },
                    ]).map((opt) => {
                      const isActive = dpiMode === opt.value;
                      const styles: Record<string, { border: string; dot: string; text: string }> = {
                        rose:    { border: isActive ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-300/50' : 'border-stone-200 hover:border-rose-300 bg-white', dot: 'bg-rose-500', text: isActive ? 'text-rose-800' : 'text-stone-600' },
                        amber:   { border: isActive ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300/50' : 'border-stone-200 hover:border-amber-300 bg-white', dot: 'bg-amber-500', text: isActive ? 'text-amber-800' : 'text-stone-600' },
                        emerald: { border: isActive ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300/50' : 'border-stone-200 hover:border-emerald-300 bg-white', dot: 'bg-emerald-500', text: isActive ? 'text-emerald-800' : 'text-stone-600' },
                      };
                      const s = styles[opt.color];
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDpiMode(opt.value)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all cursor-pointer ${s.border}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                            <span className={`text-xs font-bold ${s.text}`}>{opt.quality}</span>
                          </div>
                          <span className={`text-[11px] font-mono font-semibold ${s.text}`}>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                    <span>• Margen de seguridad: 5 mm</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Viewer first, then Specs & Backend Status */}
              <div className="lg:col-span-5 flex flex-col gap-6 order-1 lg:order-2">
                
                {/* WhatsApp CTA — above the viewer */}
                <button
                  id="whatsapp-order-btn"
                  type="button"
                  onClick={() => {
                    if (uploadedImage) {
                      setIsWhatsAppModalOpen(true);
                    } else {
                      window.open(
                        `https://wa.me/526562780886?text=${encodeURIComponent(
                          '¡Hola MalaTinta Studio! Me interesa ordenar una taza personalizada. ¿Me pueden ayudar?'
                        )}`,
                        '_blank',
                        'noopener,noreferrer'
                      );
                    }
                  }}
                  className="flex items-center justify-center gap-3 w-full px-5 py-4 rounded-2xl font-bold text-white text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
                >
                  {/* WhatsApp icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>Pedir mi taza por WhatsApp</span>
                  {uploadedImage && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white border border-white/30">
                      Enviar como Archivo
                    </span>
                  )}
                </button>

                {/* 1. Mug 3D Viewer (Blender GLB) / 2D Simulation Switcher — TOP */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-900">Previsualización de Taza</span>
                      <span className="text-[10px] text-stone-400">•</span>
                      <span className="text-[11px] font-medium text-indigo-600">
                        {previewMode === '3d' ? 'Modelo 3D Blender (GLB)' : 'Simulación 2D'}
                      </span>
                    </div>

                    <div className="flex items-center bg-stone-200/70 p-0.5 rounded-lg text-xs">
                      <button
                        id="preview-mode-3d-btn"
                        type="button"
                        onClick={() => setPreviewMode('3d')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          previewMode === '3d'
                            ? 'bg-white font-semibold text-stone-900 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Visor 3D GLB
                      </button>
                      <button
                        id="preview-mode-2d-btn"
                        type="button"
                        onClick={() => setPreviewMode('2d')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          previewMode === '2d'
                            ? 'bg-white font-semibold text-stone-900 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Simulador 2D
                      </button>
                    </div>
                  </div>

                  {previewMode === '3d' ? (
                    <Mug3DViewer
                      image={uploadedImage}
                      imageTransform={canvasSettings.imageTransform}
                      insideColor={insideColor}
                      onInsideColorChange={setInsideColor}
                    />
                  ) : (
                    <MugPreviewCard image={uploadedImage} transform={canvasSettings.imageTransform} />
                  )}
                </div>

                {/* 2. Product Specs & Sublimation Details */}
                <SpecsCard />

                {/* 3. Backend & Firebase Connectivity Status Card */}
                <BackendStatusCard />

              </div>

            </div>

            {/* Bottom Full-Width: Upload Section */}
            <div className="w-full">
              <UploadSection
                currentImage={uploadedImage}
                onImageLoaded={handleImageLoaded}
                onRemoveImage={() => handleReset()}
                fileInputRef={fileInputRef}
                dpiMode={dpiMode}
                onDpiModeChange={setDpiMode}
              />
            </div>
          </>
        )}
      </main>

      {/* Auth Modal (Login, Register & Password Reset) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Cloud Designs Firebase Modal */}
      <CloudDesignsModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        currentImage={uploadedImage}
        fitMode={canvasSettings.fitMode}
        onSelectDesign={handleLoadCloudDesign}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* WhatsApp Order Modal: Lossless 300 DPI Export & "Send as Document" Guidance */}
      <WhatsAppOrderModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        image={uploadedImage}
        transform={canvasSettings.imageTransform}
        dpiMode={dpiMode}
        insideColor={insideColor}
        isUserLoggedIn={!!user}
        userEmail={user?.email}
        onOpenAuth={() => handleOpenAuth('register')}
      />

      {/* Simple, clean footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MalaTinta Studio — Configurador de Sublimación · Cerámica 11 oz</span>
          <span className="text-stone-400">
            {isAdmin
              ? 'Conectado como Administrador (UID: 677rpirToDgJ9lNJmsvqhxOOBKf1)'
              : 'Firebase Auth & Firestore conectados'}
          </span>
        </div>
      </footer>
    </div>
  );
}
