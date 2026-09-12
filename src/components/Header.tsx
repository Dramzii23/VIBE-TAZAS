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
    <header id="app-header" className="bg-[#F5F0E8] border-b border-[#2563EB]/20 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 gap-2 sm:gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <img
              src="/assets/logo-malatinta.png"
              alt="MalaTinta Studio"
              className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display font-black text-sm sm:text-base md:text-lg tracking-tight text-stone-900 truncate">
                  MalaTinta <span className="text-[#2563EB]">Studio</span>
                </span>
                {isAdmin ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold bg-[#2563EB] text-white shrink-0">
                    ADMIN
                  </span>
                ) : (
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 shrink-0">
                    Taza 11 oz
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 font-medium hidden md:block truncate">
                {isAdmin
                  ? 'Supervisión de usuarios y archivos de Firestore'
                  : 'Configurador de personalización para sublimación'}
              </p>
            </div>
          </div>

          {/* Admin indicator (only when in admin view on larger screens) */}
          {isAdminViewActive && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 text-xs text-[#1d4ed8] font-medium">
              <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
              <span>Vista de Administrador — Firestore</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isAdmin && onToggleAdminView && (
              <button
                type="button"
                onClick={onToggleAdminView}
                className={`inline-flex items-center justify-center h-8 px-2 sm:px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer shadow-xs ${
                  isAdminViewActive
                    ? 'bg-stone-900 hover:bg-stone-800 text-white border-stone-800'
                    : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-[#1d4ed8]'
                }`}
                title={isAdminViewActive ? 'Abrir configurador de tazas' : 'Volver a panel de control'}
              >
                {isAdminViewActive ? (
                  <>
                    <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span className="hidden sm:inline ml-1.5">Configurador</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline ml-1.5">Admin</span>
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
                className="inline-flex items-center justify-center h-8 px-2 sm:px-3 text-xs font-semibold text-[#2563EB] hover:text-white bg-[#2563EB]/10 hover:bg-[#2563EB] border border-[#2563EB]/30 rounded-lg transition-colors cursor-pointer"
                title="Ver diseños guardados en Firebase Firestore"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline ml-1.5">Diseños en Nube</span>
              </button>
            )}

            {!isAdminViewActive && hasImage && (
              <button
                id="header-reset-btn"
                type="button"
                onClick={onReset}
                className="inline-flex items-center justify-center h-8 px-2 sm:px-3 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white/80 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer border border-stone-200"
                title="Limpiar imagen actual y volver a empezar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline ml-1.5">Reiniciar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
