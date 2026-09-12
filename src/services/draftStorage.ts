import { UploadedImage, DesignCanvasSettings, ImageTransform } from '../types';
import { DpiMode } from '../utils/transformUtils';
import { compressImageForStorage } from './designStorage';

export interface SavedDraft {
  image: UploadedImage | null;
  canvasSettings: DesignCanvasSettings;
  dpiMode: DpiMode;
  insideColor: string;
  savedAt: number;
}

const DRAFT_STORAGE_KEY = 'malatinta_studio_active_draft';

/**
 * Loads the currently saved draft from local storage (if any).
 */
export function loadSavedDraft(): SavedDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      image: parsed.image || null,
      canvasSettings: parsed.canvasSettings || {
        fitMode: 'contain',
        showGuides: true,
        showRulers: true,
        showZones: true,
        scale: 1.0,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        backgroundColor: '#ffffff',
      },
      dpiMode: (parsed.dpiMode as DpiMode) || 300,
      insideColor: parsed.insideColor || '#ffffff',
      savedAt: parsed.savedAt || Date.now(),
    };
  } catch (err) {
    console.warn('No se pudo recuperar el borrador desde almacenamiento local:', err);
    return null;
  }
}

/**
 * Persists the current design state to localStorage so it survives page reloads,
 * registration or login flows.
 */
export async function saveDraftLocally(
  image: UploadedImage | null,
  canvasSettings: DesignCanvasSettings,
  dpiMode: DpiMode,
  insideColor: string
): Promise<void> {
  try {
    let storedImage: UploadedImage | null = null;

    if (image) {
      // If the image dataUrl is large, compress it for safe local storage (< 500 KB)
      let safeDataUrl = image.dataUrl;
      if (safeDataUrl && safeDataUrl.length > 500000) {
        try {
          safeDataUrl = await compressImageForStorage(safeDataUrl, 500000);
        } catch (e) {
          console.warn('No se pudo comprimir la imagen para el borrador local, usando original', e);
        }
      }

      storedImage = {
        ...image,
        dataUrl: safeDataUrl,
      };
    }

    const payload: SavedDraft = {
      image: storedImage,
      canvasSettings,
      dpiMode,
      insideColor,
      savedAt: Date.now(),
    };

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Error al guardar borrador en localStorage (posible límite de cuota superado):', err);
  }
}

/**
 * Clears the active draft from local storage when the user explicitly resets.
 */
export function clearSavedDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.warn('Error al eliminar borrador de localStorage:', err);
  }
}
