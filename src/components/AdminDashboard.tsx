import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Files,
  Calendar,
  Mail,
  Search,
  RefreshCw,
  Eye,
  ExternalLink,
  ChevronRight,
  User as UserIcon,
  Trash2,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import { AdminUserSummary, isUserAdmin } from '../types';
import { SavedCloudDesign } from '../services/designStorage';
import { fetchAllUsersForAdmin, fetchUserFilesForAdmin, deleteFileByAdmin } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  onSelectDesignForEditor: (design: SavedCloudDesign) => void;
  onSwitchToEditor: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectDesignForEditor,
  onSwitchToEditor,
}) => {
  const { user: currentUser, profile: currentProfile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [userFiles, setUserFiles] = useState<SavedCloudDesign[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDesign, setPreviewDesign] = useState<SavedCloudDesign | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Prevent double-load when auth object re-evaluates
  const hasLoadedRef = React.useRef(false);

  // Load all users
  const loadUsers = async () => {
    setLoadingUsers(true);
    setErrorFeedback(null);
    try {
      const data = await fetchAllUsersForAdmin();

      // Determine which user to auto-select before setting any state
      let autoSelect: AdminUserSummary | null = null;
      if (selectedUser) {
        autoSelect = data.find((u) => u.uid === selectedUser.uid) ?? (data[0] ?? null);
      } else if (data.length > 0) {
        autoSelect = data[0];
      }

      // Batch: set users + loading off in one go
      setUsers(data);
      setLoadingUsers(false);

      // Then kick off file loading for selected user
      if (autoSelect) {
        setSelectedUser(autoSelect);
        setLoadingFiles(true);
        try {
          const files = await fetchUserFilesForAdmin(autoSelect.uid);
          setUserFiles(files);
        } catch (err) {
          console.error('Error cargando archivos del usuario:', err);
        } finally {
          setLoadingFiles(false);
        }
      }
    } catch (err: any) {
      console.error('Error cargando usuarios en panel admin:', err);
      setErrorFeedback('Error al consultar usuarios desde Firestore. Verifica permisos de administrador.');
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    // Only run once after auth resolves — ignore subsequent re-renders
    if (authLoading || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadUsers();
  }, [authLoading]);

  const handleSelectUser = async (user: AdminUserSummary) => {
    setSelectedUser(user);
    setLoadingFiles(true);
    try {
      const files = await fetchUserFilesForAdmin(user.uid);
      setUserFiles(files);
    } catch (err) {
      console.error('Error cargando archivos del usuario:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDeleteFile = async (designId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este diseño de la base de datos?')) {
      return;
    }
    setDeletingId(designId);
    try {
      await deleteFileByAdmin(designId);
      setUserFiles((prev) => prev.filter((f) => f.id !== designId));
      // Refresh user list count
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === selectedUser?.uid
            ? { ...u, uploadedFilesCount: Math.max(0, u.uploadedFilesCount - 1) }
            : u
        )
      );
      if (previewDesign?.id === designId) {
        setPreviewDesign(null);
      }
    } catch (err) {
      console.error('Error eliminando archivo:', err);
      alert('No se pudo eliminar el archivo.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUploadedFiles = users.reduce((acc, curr) => acc + curr.uploadedFilesCount, 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Admin Notice Banner */}
      <div className="bg-amber-500 text-stone-950 px-4 sm:px-6 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-amber-400">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs font-bold text-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-stone-950 tracking-tight text-sm sm:text-base">
                MODO ADMINISTRADOR ACTIVO
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-950 text-amber-300">
                <ShieldCheck className="w-3 h-3" />
                {currentUser?.email || currentProfile?.displayName || 'Super Administrador'}
              </span>
            </div>
            <p className="text-xs text-stone-900 font-medium">
              Acceso total de lectura y supervisión de usuarios y archivos en Cloud Firestore.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSwitchToEditor}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-950 text-white hover:bg-stone-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-300" />
            <span>Abrir Configurador de Tazas</span>
          </button>
        </div>
      </div>

      {/* Admin Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Usuarios Registrados
            </span>
            <p className="text-2xl font-display font-bold text-stone-900">
              {loadingUsers ? '...' : users.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Files className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Archivos Subidos en Nube
            </span>
            <p className="text-2xl font-display font-bold text-stone-900">
              {loadingUsers ? '...' : totalUploadedFiles}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Seguridad Firestore
            </span>
            <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Reglas Admin Desplegadas
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Acceso Super Admin activo para supervisión
            </p>
          </div>
          <button
            type="button"
            onClick={() => { hasLoadedRef.current = false; loadUsers(); }}
            disabled={loadingUsers}
            className="p-2.5 rounded-xl border border-stone-200 text-stone-600 hover:text-indigo-600 hover:bg-stone-50 transition-colors cursor-pointer"
            title="Refrescar lista de usuarios"
          >
            <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {errorFeedback && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
          {errorFeedback}
        </div>
      )}

      {/* Main Admin Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: User Directory List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-100 bg-stone-50/70 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Directorio de Usuarios ({filteredUsers.length})</span>
              </h3>
              <span className="text-[11px] text-stone-400">
                Haz clic en un usuario para ver sus archivos
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por correo, nombre o UID..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* User List Body */}
          <div className="divide-y divide-stone-100 max-h-[640px] overflow-y-auto">
            {loadingUsers ? (
              <div className="p-8 text-center text-xs text-stone-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Consultando usuarios en Firestore...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No se encontraron usuarios coincidentes.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUser?.uid === u.uid;
                return (
                  <div
                    key={u.uid}
                    onClick={() => handleSelectUser(u)}
                    className={`p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600 pl-3'
                        : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt={u.displayName}
                          className="w-9 h-9 rounded-xl object-cover border border-stone-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs shrink-0 border border-stone-200">
                          {u.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs text-stone-900 truncate">
                            {u.displayName}
                          </p>
                          {isUserAdmin(u.uid, u.email, null) && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{u.email}</span>
                        </p>
                        <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>Registro: {u.createdAt}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.uploadedFilesCount > 0
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                        title={`${u.uploadedFilesCount} archivos guardados`}
                      >
                        <Files className="w-3 h-3" />
                        <span>{u.uploadedFilesCount}</span>
                      </span>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-stone-300'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: User Files & Details */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {selectedUser ? (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
              {/* Selected User Header */}
              <div className="p-5 border-b border-stone-100 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {selectedUser.photoURL ? (
                    <img
                      src={selectedUser.photoURL}
                      alt={selectedUser.displayName}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {selectedUser.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-base text-stone-900">
                        {selectedUser.displayName}
                      </h4>
                      {isUserAdmin(selectedUser.uid, selectedUser.email, null) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          SUPER ADMIN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 font-mono mt-0.5">
                      {selectedUser.email}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-1">
                      <span>Registrado: {selectedUser.createdAt}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-stone-400 truncate max-w-[180px]">
                        UID: {selectedUser.uid}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Total Archivos</span>
                  <span className="text-xl font-display font-bold text-indigo-600">
                    {userFiles.length}
                  </span>
                </div>
              </div>

              {/* Files Grid / List */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold text-xs text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-indigo-600" />
                    <span>Archivos y Diseños de este Usuario</span>
                  </h5>
                  {loadingFiles && (
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      Cargando archivos...
                    </span>
                  )}
                </div>

                {loadingFiles ? (
                  <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                    <span>Cargando diseños desde Firestore...</span>
                  </div>
                ) : userFiles.length === 0 ? (
                  <div className="py-12 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-2xl flex flex-col items-center gap-2">
                    <Files className="w-8 h-8 text-stone-300" />
                    <p className="font-medium text-stone-600">Este usuario aún no ha guardado diseños de tazas.</p>
                    <p className="text-[11px] text-stone-400">Cuando personalice y guarde en la nube, aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                      >
                        {/* File Thumbnail */}
                        <div className="relative aspect-[20/9.5] rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-900/80 text-white backdrop-blur-xs">
                              {file.fitMode}
                            </span>
                          </div>
                        </div>

                        {/* File Info */}
                        <div>
                          <h6 className="font-semibold text-xs text-stone-900 truncate" title={file.name}>
                            {file.name}
                          </h6>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                            {file.imageName}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5">
                            <span>{file.dimensions?.width} × {file.dimensions?.height} px</span>
                            <span>{file.createdAt ? String(file.createdAt) : ''}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewDesign(file)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Completo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectDesignForEditor(file)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                            title="Cargar diseño en el lienzo de sublimación"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === file.id}
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Eliminar diseño de Firestore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 flex flex-col items-center gap-3">
              <Users className="w-10 h-10 text-stone-300" />
              <p className="text-sm font-semibold text-stone-700">Selecciona un usuario de la lista</p>
              <p className="text-xs text-stone-400">Podrás examinar todos sus archivos cargados y diseños guardados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal for viewing full design & image preview */}
      {previewDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div
            className="bg-white w-full max-w-2xl rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <div className="overflow-hidden pr-2">
                <h4 className="font-display font-bold text-sm text-stone-900 truncate">
                  {previewDesign.name}
                </h4>
                <p className="text-xs text-stone-500 truncate">
                  Archivo original: {previewDesign.imageName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDesign(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="w-full aspect-[20/9.5] rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center">
                <img
                  src={previewDesign.dataUrl}
                  alt={previewDesign.name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
                <div>
                  <span className="text-stone-400 block text-[10px]">Modo de ajuste</span>
                  <span className="font-semibold text-stone-800 uppercase">{previewDesign.fitMode}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Resolución</span>
                  <span className="font-semibold text-stone-800">
                    {previewDesign.dimensions?.width} × {previewDesign.dimensions?.height} px
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Peso Formateado</span>
                  <span className="font-semibold text-stone-800">
                    {previewDesign.dimensions?.sizeFormatted || 'Optimizado'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Fecha de creación</span>
                  <span className="font-semibold text-stone-800 truncate block">
                    {previewDesign.createdAt ? String(previewDesign.createdAt) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewDesign(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectDesignForEditor(previewDesign);
                  setPreviewDesign(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Abrir en Lienzo de Sublimación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
