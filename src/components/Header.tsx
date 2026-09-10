import React from 'react';
import { Sparkles, Layers, Image as ImageIcon, Box, RotateCcw, Cloud, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  hasImage: boolean;
  onReset: () => void;
  onOpenCloudModal: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  isAdmin?: boolean;
  isAdminViewActive?: boolean;
  onToggleAdminView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasImage,
  onReset,
  onOpenCloudModal,
  onOpenAuth,
  isAdmin,
  isAdminViewActive,
  onToggleAdminView,
}) => {
  return (
    <header id="app-header" className="bg-white border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand & Product context */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
              isAdmin ? 'bg-amber-600' : 'bg-stone-900'
            }`}>
              {isAdmin ? (
                <ShieldAlert className="w-5 h-5 text-amber-200" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-stone-900">
                  SubliStudio
                </span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-stone-950 border border-amber-400">
                    PANEL ADMIN
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    MVP • Taza 11 oz
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium hidden sm:block">
                {isAdmin
                  ? 'Supervisión de usuarios y archivos de Firestore'
                  : 'Configurador de personalización para sublimación'}
              </p>
            </div>
          </div>

          {/* Stepper Workflow (shown only in editor view) */}
          {!isAdminViewActive ? (
            <div className="hidden md:flex items-center gap-2 bg-stone-100/80 p-1.5 rounded-xl border border-stone-200/80 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-white text-stone-900 shadow-xs border border-stone-200/60">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Cargar diseño</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-stone-400 select-none">
                <Layers className="w-3.5 h-3.5" />
                <span>2. Acomodar</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-stone-400 select-none">
                <Box className="w-3.5 h-3.5" />
                <span>3. Vista 3D</span>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Vista de Administrador — Base de datos Firestore</span>
            </div>
          )}

          {/* Action Header Items */}
          <div className="flex items-center gap-3">
            {/* If admin, quick view toggle button */}
            {isAdmin && onToggleAdminView && (
              <button
                type="button"
                onClick={onToggleAdminView}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer shadow-xs ${
                  isAdminViewActive
                    ? 'bg-stone-900 hover:bg-stone-800 text-white border-stone-800'
                    : 'bg-amber-500 hover:bg-amber-600 text-stone-950 border-amber-400'
                }`}
                title={isAdminViewActive ? 'Abrir configurador de tazas' : 'Volver a panel de control'}
              >
                {isAdminViewActive ? (
                  <>
                    <Layers className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Ir al Configurador</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Panel Admin</span>
                  </>
                )}
              </button>
            )}

            {/* User Auth Menu (Login / Register / Profile) */}
            <UserMenu
              onOpenAuth={onOpenAuth}
              onOpenCloudModal={onOpenCloudModal}
              onToggleAdminView={onToggleAdminView}
              isAdminViewActive={isAdminViewActive}
            />

            {/* Cloud Designs Button (shown if in editor) */}
            {!isAdminViewActive && (
              <button
                id="open-cloud-designs-btn"
                type="button"
                onClick={onOpenCloudModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg transition-colors cursor-pointer"
                title="Ver diseños guardados en Firebase Firestore"
              >
                <Cloud className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Diseños en Nube</span>
              </button>
            )}

            {!isAdminViewActive && hasImage && (
              <button
                id="header-reset-btn"
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 rounded-lg transition-colors cursor-pointer"
                title="Limpiar imagen actual y volver a empezar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
