import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck2,
  Paperclip,
  Download,
  AlertTriangle,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Info,
} from 'lucide-react';
import { UploadedImage, ImageTransform } from '../types';
import { DpiMode } from '../utils/transformUtils';
import {
  generateSublimationPrintFile,
  triggerFileDownload,
  PrintExportResult,
} from '../utils/printExport';

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: UploadedImage | null;
  transform: ImageTransform | null | undefined;
  dpiMode: DpiMode;
  insideColor: string;
  isUserLoggedIn?: boolean;
  userEmail?: string | null;
  onOpenAuth?: () => void;
}

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({
  isOpen,
  onClose,
  image,
  transform,
  dpiMode,
  insideColor,
  isUserLoggedIn = false,
  userEmail = null,
  onOpenAuth,
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<PrintExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);

  // Map hex color to human name
  const getColorName = (hex: string): string => {
    const map: Record<string, string> = {
      '#ffffff': 'Blanco (Clásico)',
      '#1a1a1a': 'Negro',
      '#dc2626': 'Rojo',
      '#2563eb': 'Azul',
      '#16a34a': 'Verde',
      '#ca8a04': 'Amarillo',
      '#db2777': 'Rosa',
      '#ea580c': 'Naranja',
      '#7c3aed': 'Morado',
      '#6b7280': 'Gris',
    };
    return map[hex.toLowerCase()] || hex;
  };

  // Build the WhatsApp message text
  const buildWhatsAppMessage = (): string => {
    if (!image) {
      return '¡Hola MalaTinta Studio! Me interesa pedir una taza personalizada de 11 oz. ¿Me pueden dar información?';
    }

    const colorLabel = getColorName(insideColor);
    const fileName = exportResult?.fileName || `MalaTinta_Impresion_${image.name}_300DPI.png`;

    return (
      `¡Hola MalaTinta Studio! Quiero ordenar una taza personalizada con mi diseño.\n\n` +
      `📋 *Detalles del pedido:*\n` +
      `• *Diseño:* ${image.name}\n` +
      `• *Color interior de la taza:* ${colorLabel} (sujeto a disponibilidad de stock)\n` +
      `• *Archivo descargado:* ${fileName}\n` +
      `• *Resolución:* 20 × 9.5 cm @ ${dpiMode} DPI (sin compresión)\n` +
      (isUserLoggedIn && userEmail ? `• *Cliente registrado:* ${userEmail}\n\n` : `\n`) +
      `📎 *Nota:* Te adjunto el archivo a continuación como DOCUMENTO para asegurar la máxima calidad de impresión.`
    );
  };

  // Automatically export and trigger download when modal opens
  useEffect(() => {
    if (!isOpen || !image) {
      setExportResult(null);
      setExportError(null);
      return;
    }

    let isMounted = true;
    setIsExporting(true);
    setExportError(null);

    generateSublimationPrintFile(image, transform, dpiMode)
      .then((res) => {
        if (!isMounted) return;
        setExportResult(res);
        setIsExporting(false);
        // Automatically download to user's device
        triggerFileDownload(res.blob, res.fileName);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error generando archivo de producción:', err);
        setExportError(err.message || 'No se pudo generar el archivo de producción.');
        setIsExporting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, image, transform, dpiMode]);

  if (!isOpen) return null;

  const handleDownloadAgain = () => {
    if (!exportResult) return;
    triggerFileDownload(exportResult.blob, exportResult.fileName);
  };

  const handleOpenWhatsApp = () => {
    const text = buildWhatsAppMessage();
    const url = `https://wa.me/526562780886?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = () => {
    const text = buildWhatsAppMessage();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    });
  };

  return (
    <div
      id="whatsapp-order-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="whatsapp-order-modal-content"
        className="relative w-full max-w-xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#F5F0E8] border-b border-stone-200/80 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-xs">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-stone-900 leading-tight">
                Pedir Taza por WhatsApp
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                MalaTinta Studio · Impresión de Alta Definición
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-5 max-h-[calc(85vh-130px)] overflow-y-auto">
          
          {/* CRITICAL WARNING BANNER: SEND AS FILE/DOCUMENT */}
          <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 sm:p-5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>REGLA FUNDAMENTAL: Envía como ARCHIVO / DOCUMENTO</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-950/90 leading-relaxed">
              WhatsApp comprime fuertemente las fotos normales, lo que arruina la resolución en la impresión de tu taza.{' '}
              <strong className="text-amber-950 font-bold">
                Para que tu taza quede 100% nítida a 300 DPI, debes adjuntar el archivo descargado como "Documento" (clip 📎), NO como "Foto".
              </strong>
            </p>
          </div>

          {/* 3 Step Visual Instructions */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Sigue estos 3 sencillos pasos:
            </h4>

            {/* Step 1: File Downloaded */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  {isExporting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileCheck2 className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">
                      Paso 1: Archivo descargado en tu dispositivo
                    </span>
                    {exportResult && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Listo
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-stone-600 truncate mt-0.5">
                    {exportResult?.fileName || 'Generando archivo PNG a 300 DPI...'}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    2362 × 1122 px · 20 × 9.5 cm · Formato sublimación
                    {exportResult ? ` · ${exportResult.fileSizeFormatted}` : ''}
                  </p>
                </div>
              </div>

              {exportResult && (
                <button
                  type="button"
                  onClick={handleDownloadAgain}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  title="Descargar el archivo nuevamente"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Volver a descargar</span>
                </button>
              )}
            </div>

            {/* Step 2: How to attach in WhatsApp */}
            <div className="rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-4 flex flex-col gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900">
                    Paso 2: En WhatsApp, toca el ícono de adjuntar (📎 Clip o +)
                  </span>
                  <p className="text-[11px] text-stone-500">
                    Selecciona la opción correcta en el menú:
                  </p>
                </div>
              </div>

              {/* Comparison grid: Do not choose photos, choose document */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center gap-2 text-rose-900">
                  <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-xs font-black shrink-0">
                    ✕
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight line-through">Fotos y videos</p>
                    <p className="text-[10px] text-rose-700 leading-tight">Comprime la imagen</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 flex items-center gap-2 text-emerald-950">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shrink-0">
                    ✓
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black leading-tight">Documento / Archivo</p>
                    <p className="text-[10px] text-emerald-800 font-semibold leading-tight">¡Calidad 100% original!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Send */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 sm:p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900">
                  Paso 3: Selecciona el archivo y envíalo
                </span>
                <p className="text-[11px] text-stone-500">
                  Tu mensaje de WhatsApp ya llevará los detalles de tu taza (color interior: <strong>{getColorName(insideColor)}</strong>, sujeto a disponibilidad).
                </p>
              </div>
            </div>
          </div>

          {/* Account / Persistence Advice */}
          {!isUserLoggedIn ? (
            <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-3.5 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-950">Tu diseño está a salvo</span>
                  <p className="text-indigo-900/80 text-[11px] mt-0.5">
                    Tu diseño se conserva automáticamente en la memoria del navegador. Si deseas conservarlo para siempre en tu historial, puedes crear tu cuenta gratis en cualquier momento.
                  </p>
                </div>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 shrink-0 cursor-pointer"
                >
                  Registrarse
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-3 flex items-center gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Conectado como <strong>{userEmail}</strong> · Tu diseño está respaldado en tu cuenta.</span>
            </div>
          )}

          {/* Print preview thumbnail if available */}
          {exportResult?.dataUrl && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-stone-500">
                Vista previa del archivo de impresión (20 × 9.5 cm):
              </span>
              <div className="w-full aspect-[20/9.5] rounded-xl border border-stone-200 overflow-hidden bg-white shadow-inner flex items-center justify-center">
                <img
                  src={exportResult.dataUrl}
                  alt="Plantilla para sublimar"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-stone-50 border-t border-stone-200 px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 border border-stone-200 transition-colors cursor-pointer"
            title="Copiar texto del mensaje al portapapeles"
          >
            {copiedMessage ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">¡Mensaje copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar texto</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Continuar a WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
