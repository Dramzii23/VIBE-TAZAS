import React from 'react';
import { Layers, RotateCcw, Cloud, ShieldAlert, LayoutDashboard } from 'lucide-react';
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
    <header id="app-header" className="bg-[#F5F0E8] border-b border-[#2563EB]/20 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-malatinta.png"
              alt="MalaTinta Studio"
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg sm:text-xl tracking-tight text-stone-900">
                  MalaTinta Studio
                </span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#2563EB] text-white border border-[#1d4ed8]">
                    PANEL ADMIN
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
                    Taza 11 oz
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

          {/* Admin indicator (only when in admin view) */}
          {isAdminViewActive && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 text-xs text-[#1d4ed8] font-medium">
              <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
              <span>Vista de Administrador — Base de datos Firestore</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAdmin && onToggleAdminView && (
              <button
                type="button"
                onClick={onToggleAdminView}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer shadow-xs ${
                  isAdminViewActive
                    ? 'bg-stone-900 hover:bg-stone-800 text-white border-stone-800'
                    : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-[#1d4ed8]'
                }`}
                title={isAdminViewActive ? 'Abrir configurador de tazas' : 'Volver a panel de control'}
              >
                {isAdminViewActive ? (
                  <>
                    <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
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

            <UserMenu
              onOpenAuth={onOpenAuth}
              onOpenCloudModal={onOpenCloudModal}
              onToggleAdminView={onToggleAdminView}
              isAdminViewActive={isAdminViewActive}
            />

            {!isAdminViewActive && (
              <button
                id="open-cloud-designs-btn"
                type="button"
                onClick={onOpenCloudModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:text-white bg-[#2563EB]/10 hover:bg-[#2563EB] border border-[#2563EB]/30 rounded-lg transition-colors cursor-pointer"
                title="Ver diseños guardados en Firebase Firestore"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Diseños en Nube</span>
              </button>
            )}

            {!isAdminViewActive && hasImage && (
              <button
                id="header-reset-btn"
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white/80 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer border border-stone-200"
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
