import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  LogOut,
  Cloud,
  ChevronDown,
  CheckCircle2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_UID, isUserAdmin } from '../types';

interface UserMenuProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenCloudModal: () => void;
  onToggleAdminView?: () => void;
  isAdminViewActive?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onOpenAuth,
  onOpenCloudModal,
  onToggleAdminView,
  isAdminViewActive,
}) => {
  const { user, profile, logout, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-24 h-8 rounded-lg bg-stone-100 animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          id="header-login-btn"
          type="button"
          onClick={() => onOpenAuth('login')}
          className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors cursor-pointer"
        >
          Iniciar Sesión
        </button>
        <button
          id="header-register-btn"
          type="button"
          onClick={() => onOpenAuth('register')}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          Registrarse
        </button>
      </div>
    );
  }

  const isAdmin = isUserAdmin(user.uid, user.email, profile?.role);
  const displayName = profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Usuario';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="user-profile-menu-btn"
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
          isAdmin
            ? 'border-amber-400 bg-amber-50/50 hover:bg-amber-100/50'
            : 'border-stone-200 bg-white hover:bg-stone-50'
        }`}
      >
        {profile?.photoURL || user.photoURL ? (
          <img
            src={profile?.photoURL || user.photoURL || ''}
            alt={displayName}
            className="w-7 h-7 rounded-lg object-cover border border-stone-200"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-xs ${
            isAdmin ? 'bg-amber-600' : 'bg-indigo-600'
          }`}>
            {initials}
          </div>
        )}
        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-stone-900 leading-none truncate max-w-[120px]">
              {displayName}
            </p>
            {isAdmin && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500 text-stone-950 uppercase">
                Admin
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium leading-none">
            Conectado
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-stone-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-2.5 border-b border-stone-100">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-semibold text-stone-900 truncate">
                {displayName}
              </p>
              {isAdmin && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                  ADMINISTRADOR
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500 font-mono truncate mt-0.5">
              {user.email}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Firebase Auth Activo</span>
            </div>
          </div>

          <div className="py-1">
            {isAdmin && onToggleAdminView && (
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onToggleAdminView();
                }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-amber-900 hover:bg-amber-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {isAdminViewActive ? 'Abrir Modo Configurador' : 'Ver Panel de Administrador'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                onOpenCloudModal();
              }}
              className="w-full px-4 py-2 text-left text-xs font-medium text-stone-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mis Diseños Guardados en Nube</span>
            </button>
          </div>

          <div className="border-t border-stone-100 pt-1">
            <button
              id="btn-logout"
              type="button"
              onClick={async () => {
                setDropdownOpen(false);
                await logout();
              }}
              className="w-full px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
