import { UploadedImage, ImageTransform, STANDARD_MUG_SPEC } from '../types';
import { DpiMode } from './transformUtils';

export interface PrintExportResult {
  blob: Blob;
  dataUrl: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  dimensions: {
    width: number;
    height: number;
    dpi: number;
  };
}

/**
 * Generates an uncompressed print-ready PNG file according to the sublimation template (20 x 9.5 cm).
 * Default 300 DPI gives 2362 x 1122 pixels.
 */
export async function generateSublimationPrintFile(
  image: UploadedImage,
  transform: ImageTransform | null | undefined,
  dpi: DpiMode = 300
): Promise<PrintExportResult> {
  const widthPx = STANDARD_MUG_SPEC.printWidthPx; // 2362 px
  const heightPx = STANDARD_MUG_SPEC.printHeightPx; // 1122 px

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto de renderizado 2D para exportar la plantilla de sublimación.');
  }

  // Pure white sublimation base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthPx, heightPx);

  // Load the full image
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Error al cargar la imagen para exportar el archivo de producción.'));
    img.src = image.dataUrl;
  });

  // Calculate coordinates from percentage transform (0-100%)
  const t = transform || { x: 0, y: 0, width: 100, height: 100 };
  const destX = (t.x / 100) * widthPx;
  const destY = (t.y / 100) * heightPx;
  const destW = (t.width / 100) * widthPx;
  const destH = (t.height / 100) * heightPx;

  // Clip to canvas boundaries
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, widthPx, heightPx);
  ctx.clip();
  ctx.drawImage(img, destX, destY, destW, destH);
  ctx.restore();

  // Convert to PNG blob (uncompressed lossless 300 DPI)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('No se pudo generar el archivo PNG para producción.'));
    }, 'image/png');
  });

  const dataUrl = canvas.toDataURL('image/png');
  const cleanName = image.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `MalaTinta_Impresion_${cleanName}_${dpi}DPI.png`;

  const bytes = blob.size;
  const fileSizeFormatted = bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

  return {
    blob,
    dataUrl,
    fileName,
    fileSizeBytes: bytes,
    fileSizeFormatted,
    dimensions: {
      width: widthPx,
      height: heightPx,
      dpi,
    },
  };
}

/**
 * Triggers a native browser file download of a Blob or data URL.
 */
export function triggerFileDownload(blobOrUrl: Blob | string, fileName: string) {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof blobOrUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
