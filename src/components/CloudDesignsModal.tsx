import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Save,
  Trash2,
  RefreshCw,
  FolderOpen,
  AlertCircle,
  Check,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  SavedCloudDesign,
  saveDesignToCloud,
  fetchUserDesigns,
  deleteCloudDesign,
} from '../services/designStorage';
import { UploadedImage, FitMode } from '../types';

interface CloudDesignsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage: UploadedImage | null;
  fitMode: FitMode;
  onSelectDesign: (design: SavedCloudDesign) => void;
  onOpenAuth: () => void;
}

export const CloudDesignsModal: React.FC<CloudDesignsModalProps> = ({
  isOpen,
  onClose,
  currentImage,
  fitMode,
  onSelectDesign,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [designs, setDesigns] = useState<SavedCloudDesign[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [designName, setDesignName] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadDesigns = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await fetchUserDesigns(user.uid);
      setDesigns(list);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'No se pudieron cargar los diseños guardados.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      if (user) {
        loadDesigns();
      }
      if (currentImage && !designName) {
        setDesignName(`Diseño Taza - ${currentImage.name.replace(/\.[^/.]+$/, '')}`);
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFeedback({ type: 'error', message: 'Inicia sesión para guardar tu diseño en la nube.' });
      return;
    }
    if (!currentImage) {
      setFeedback({ type: 'error', message: 'Carga una imagen en el lienzo antes de guardar.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      await saveDesignToCloud(designName, currentImage, fitMode);
      setFeedback({ type: 'success', message: '¡Diseño guardado en Firebase Firestore con éxito!' });
      await loadDesigns();
    } catch (err: any) {
      let msg = 'Error al guardar el diseño.';
      try {
        if (typeof err?.message === 'string' && err.message.startsWith('{')) {
          const parsed = JSON.parse(err.message);
          if (parsed?.error) {
            if (parsed.error.includes('exceeds the maximum allowed size')) {
              msg = 'El tamaño del diseño excede el límite permitido por Firestore (1 MB). Intenta con una imagen más ligera.';
            } else if (parsed.error.includes('permission-denied') || parsed.error.includes('Missing or insufficient permissions')) {
              msg = 'Permiso denegado. Asegúrate de haber iniciado sesión con tu cuenta.';
            } else {
              msg = parsed.error;
            }
          }
        } else if (err?.message) {
          msg = err.message;
        }
      } catch {
        msg = err?.message || msg;
      }
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (designId: string) => {
    try {
      await deleteCloudDesign(designId);
      setDesigns((prev) => prev.filter((d) => d.id !== designId));
      setFeedback({ type: 'success', message: 'Diseño eliminado correctamente.' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'No se pudo eliminar el diseño.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-stone-900 leading-tight">
                Diseños en la Nube (Firestore)
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Almacenamiento persistente de configuraciones de tazas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`px-4 py-3 text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
                : 'bg-rose-50 text-rose-800 border-b border-rose-100'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 flex-1">
          {/* If NOT logged in */}
          {!user ? (
            <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-stone-900 text-sm">
                  Inicia sesión para guardar tus diseños
                </h4>
                <p className="text-xs text-stone-600 max-w-md mt-1">
                  Crea una cuenta con correo y contraseña o accede con Google para almacenar tus plantillas en Firebase y abrirlas cuando quieras.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Iniciar Sesión / Registrarse
              </button>
            </div>
          ) : (
            <>
              {/* Save current design section */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col gap-3">
                <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Guardar diseño actual</span>
                </h4>

                {currentImage ? (
                  <form onSubmit={handleSave} className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Nombre del diseño (ej. Taza Cumpleaños Juan)"
                      value={designName}
                      onChange={(e) => setDesignName(e.target.value)}
                      className="flex-1 w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar en Nube</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-stone-500">
                    Aún no has cargado ninguna imagen en el lienzo para guardar.
                  </p>
                )}
              </div>

              {/* List of saved designs */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tus diseños guardados ({designs.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={loadDesigns}
                    disabled={loading}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-stone-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                    <span>Cargando tus diseños desde Firestore...</span>
                  </div>
                ) : designs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-xl">
                    No tienes diseños guardados en tu cuenta todavía.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {designs.map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-xl border border-stone-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={d.dataUrl}
                            alt={d.name}
                            className="w-16 h-12 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <h5 className="text-xs font-semibold text-stone-900 truncate" title={d.name}>
                              {d.name}
                            </h5>
                            <p className="text-[11px] text-stone-500 truncate mt-0.5">
                              {d.imageName}
                            </p>
                            <span className="inline-block text-[10px] text-stone-400 font-mono mt-0.5">
                              Ajuste: {d.fitMode}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectDesign(d);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-indigo-600 hover:text-white text-stone-700 font-semibold rounded-md transition-colors cursor-pointer"
                          >
                            Cargar en Lienzo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Eliminar diseño"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
