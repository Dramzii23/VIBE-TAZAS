import React, { useState, useRef, useEffect } from 'react';
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
import { UploadedImage, DesignCanvasSettings, ADMIN_UID, isUserAdmin } from './types';
import { SavedCloudDesign } from './services/designStorage';
import { computeInitialTransform } from './utils/transformUtils';
import { useAuth } from './context/AuthContext';
import { CheckCircle2, Sparkles, Cloud, UserCheck, ShieldAlert, Layers } from 'lucide-react';

export default function App() {
  const { user, profile } = useAuth();
  const isAdmin = isUserAdmin(user?.uid, user?.email, profile?.role);

  // Admin view toggle (defaults to 'admin' when admin logs in)
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'editor'>('admin');

  // When admin logs in, default to the admin view
  useEffect(() => {
    if (isAdmin) {
      setAdminViewMode('admin');
    }
  }, [user?.uid, isAdmin]);

  // State for the uploaded image
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

  // Preview mode (3D GLB model by default, or 2D silhouette simulation)
  const [previewMode, setPreviewMode] = useState<'3d' | '2d'>('3d');

  // Modals state
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

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
      imageTransform: null,
    }));
  };

  const handleImageLoaded = (img: UploadedImage) => {
    setUploadedImage(img);
    const initial = computeInitialTransform(img.width, img.height, canvasSettings.fitMode);
    setCanvasSettings((prev) => ({
      ...prev,
      imageTransform: initial,
    }));
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLoadCloudDesign = (design: SavedCloudDesign) => {
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
  };

  const isShowingAdminDashboard = isAdmin && adminViewMode === 'admin';

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
            onSwitchToEditor={() => setAdminViewMode('editor')}
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
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Configurador de Sublimación • Taza Cerámica 11 oz</span>
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

              {/* Right Column: Upload Controls, Previews & Backend Status */}
              <div className="lg:col-span-5 flex flex-col gap-6 order-1 lg:order-2">
                
                {/* 1. Upload Section with Drag & Drop and Feedback */}
                <UploadSection
                  currentImage={uploadedImage}
                  onImageLoaded={handleImageLoaded}
                  onRemoveImage={() => handleReset()}
                  fileInputRef={fileInputRef}
                />

                {/* 2. Mug 3D Viewer (Blender GLB) / 2D Simulation Switcher */}
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
                    />
                  ) : (
                    <MugPreviewCard image={uploadedImage} transform={canvasSettings.imageTransform} />
                  )}
                </div>

                {/* 3. Product Specs & Sublimation Details */}
                <SpecsCard />

                {/* 4. Backend & Firebase Connectivity Status Card */}
                <BackendStatusCard />

              </div>

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

      {/* Simple, clean footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Configurador de Sublimación MVP — Cerámica 11 oz</span>
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
