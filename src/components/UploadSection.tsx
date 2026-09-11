import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileImage, 
  Check, 
  AlertCircle, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck,
} from 'lucide-react';
import { UploadedImage } from '../types';
import { SAMPLE_DESIGNS, SampleDesign } from '../data/sampleDesigns';
import { DpiMode, pixelsToCm, CANVAS_WIDTH_CM, CANVAS_HEIGHT_CM } from '../utils/transformUtils';

interface UploadSectionProps {
  currentImage: UploadedImage | null;
  onImageLoaded: (image: UploadedImage) => void;
  onRemoveImage: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  dpiMode: DpiMode;
  onDpiModeChange: (dpi: DpiMode) => void;
}

const DPI_OPTIONS: { value: DpiMode; label: string; quality: string; color: string }[] = [
  {
    value: 72,
    label: '72 DPI',
    quality: 'Baja',
    color: 'rose',
  },
  {
    value: 150,
    label: '150 DPI',
    quality: 'Media',
    color: 'amber',
  },
  {
    value: 300,
    label: '300 DPI',
    quality: 'Alta',
    color: 'emerald',
  },
];

export const UploadSection: React.FC<UploadSectionProps> = ({
  currentImage,
  onImageLoaded,
  onRemoveImage,
  fileInputRef,
  dpiMode,
  onDpiModeChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /** Calculates the DPI rating based on the selected DPI mode and image pixel dimensions. */
  const calculateDpiRating = (
    width: number,
    height: number,
    dpi: DpiMode
  ): { rating: 'optima' | 'buena' | 'baja'; text: string } => {
    // Physical size at selected DPI
    const physW = pixelsToCm(width, dpi);
    const physH = pixelsToCm(height, dpi);

    // Check if image covers the print area at the selected DPI
    const coverageW = physW / CANVAS_WIDTH_CM;
    const coverageH = physH / CANVAS_HEIGHT_CM;
    const coverage = Math.min(coverageW, coverageH);

    if (dpi === 300 && coverage >= 0.75) {
      return { rating: 'optima', text: `Alta resolución — ${width}×${height}px @ 300 DPI (~${physW.toFixed(1)} × ${physH.toFixed(1)} cm)` };
    } else if ((dpi === 150 && coverage >= 0.5) || (dpi === 300 && coverage >= 0.35)) {
      return { rating: 'buena', text: `Resolución media — ${width}×${height}px @ ${dpi} DPI (~${physW.toFixed(1)} × ${physH.toFixed(1)} cm)` };
    } else {
      return { rating: 'baja', text: `Baja resolución — ${width}×${height}px @ ${dpi} DPI (~${physW.toFixed(1)} × ${physH.toFixed(1)} cm)` };
    }
  };

  const processFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      setFeedbackMessage({ type: 'error', text: 'Formato no compatible. Por favor sube un archivo JPG o PNG.' });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFeedbackMessage({ type: 'error', text: 'El archivo excede el tamaño máximo permitido de 25 MB.' });
      return;
    }

    setIsProcessing(true);
    setFeedbackMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const { rating, text } = calculateDpiRating(img.width, img.height, dpiMode);
        const physW = pixelsToCm(img.width, dpiMode);
        const physH = pixelsToCm(img.height, dpiMode);

        const uploadedImg: UploadedImage = {
          id: `img-${Date.now()}`,
          name: file.name,
          dataUrl,
          sizeBytes: file.size,
          sizeFormatted: formatFileSize(file.size),
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          dpiRating: rating,
          dpiRatingText: text,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setIsProcessing(false);
        onImageLoaded(uploadedImg);
        setFeedbackMessage({
          type: 'success',
          text: `"${file.name}" cargado. Tamaño físico @ ${dpiMode} DPI: ${physW.toFixed(1)} × ${physH.toFixed(1)} cm.`,
        });

        setTimeout(() => {
          setFeedbackMessage((prev) => (prev?.type === 'success' ? null : prev));
        }, 6000);
      };

      img.onerror = () => {
        setIsProcessing(false);
        setFeedbackMessage({ type: 'error', text: 'No se pudo leer la imagen seleccionada. Intenta con otra imagen.' });
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setFeedbackMessage({ type: 'error', text: 'Ocurrió un error al leer el archivo desde el dispositivo.' });
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const loadSample = (sample: SampleDesign) => {
    setIsProcessing(true);
    setFeedbackMessage(null);
    const { rating, text } = calculateDpiRating(sample.width, sample.height, dpiMode);
    const uploadedImg: UploadedImage = {
      id: `sample-${Date.now()}`,
      name: `${sample.name}.svg`,
      dataUrl: sample.dataUrl,
      sizeBytes: 15400,
      sizeFormatted: '15.4 KB',
      width: sample.width,
      height: sample.height,
      aspectRatio: sample.width / sample.height,
      dpiRating: rating,
      dpiRatingText: text,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setTimeout(() => {
      setIsProcessing(false);
      onImageLoaded(uploadedImg);
      setFeedbackMessage({ type: 'success', text: `Plantilla "${sample.name}" cargada en el área de diseño.` });
    }, 150);
  };

  // Physical size of current image at the selected DPI
  const physicalSize = currentImage
    ? {
        w: pixelsToCm(currentImage.width, dpiMode).toFixed(1),
        h: pixelsToCm(currentImage.height, dpiMode).toFixed(1),
      }
    : null;

  const selectedDpiOption = DPI_OPTIONS.find(o => o.value === dpiMode)!;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        id="mug-design-file-input"
        type="file"
        accept=".jpg, .jpeg, .png, image/jpeg, image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main upload card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base sm:text-lg text-stone-900 flex items-center gap-2">
            <FileImage className="w-5 h-5 text-indigo-600" />
            Cargar Diseño
          </h2>
          <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Paso 1
          </span>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 mb-4 leading-relaxed">
          Selecciona una fotografía, arte o ilustración en formato <strong>JPG</strong> o <strong>PNG</strong>.
        </p>

        {/* Drag and Drop Zone */}
        <div
          id="drop-zone-container"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-xl border-2 transition-all p-6 text-center cursor-pointer select-none flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/70 ring-4 ring-indigo-500/20 scale-[1.01]'
              : 'border-dashed border-stone-300 bg-stone-50/50 hover:bg-stone-50 hover:border-indigo-400'
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            isDragging ? 'bg-indigo-600 text-white scale-110 shadow-md' : 'bg-indigo-100 text-indigo-600 shadow-xs'
          }`}>
            {isProcessing
              ? <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              : <UploadCloud className="w-7 h-7 stroke-[2]" />
            }
          </div>

          <div>
            <p className="text-sm font-semibold text-stone-900 mb-1">
              {isDragging ? 'Suelta la imagen aquí' : 'Arrastra tu archivo o haz clic aquí'}
            </p>
            <p className="text-xs text-stone-500">
              Formatos aceptados: <span className="font-semibold text-stone-700">JPG, JPEG o PNG</span> (máx. 25 MB)
            </p>
          </div>

          <button
            id="btn-select-file"
            type="button"
            disabled={isProcessing}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 active:scale-[0.98] transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
          >
            {isProcessing ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /><span>Procesando imagen...</span></>
            ) : (
              <><UploadCloud className="w-4 h-4" /><span>{currentImage ? 'Seleccionar otra imagen' : 'Seleccionar imagen desde computadora'}</span></>
            )}
          </button>
        </div>

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div
            id="upload-feedback-alert"
            className={`mt-4 p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-start gap-2.5 transition-all ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {feedbackMessage.type === 'success'
              ? <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            }
            <div className="flex-1"><p>{feedbackMessage.text}</p></div>
            {feedbackMessage.type === 'success' && (
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                Cargada
              </span>
            )}
          </div>
        )}

        {/* Current Image Metadata Card */}
        {currentImage && (
          <div id="uploaded-image-details-card" className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200/90">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                  <img src={currentImage.dataUrl} alt={currentImage.name} className="w-full h-full object-cover rounded" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate max-w-[200px] sm:max-w-[260px]">
                    {currentImage.name}
                  </p>
                  <p className="text-[11px] text-stone-500 font-mono">
                    {currentImage.width} × {currentImage.height} px • {currentImage.sizeFormatted}
                  </p>
                  {physicalSize && (
                    <p className="text-[11px] text-indigo-600 font-mono font-semibold">
                      {physicalSize.w} × {physicalSize.h} cm @ {dpiMode} DPI
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  id="replace-image-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-stone-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-stone-200"
                  title="Cambiar por otra imagen"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  id="delete-image-btn"
                  type="button"
                  onClick={onRemoveImage}
                  className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                  title="Eliminar diseño del área"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quality Badge */}
            <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/80 text-xs">
              <span className="text-stone-600 flex items-center gap-1.5">
                <ShieldCheck className={`w-3.5 h-3.5 ${
                  currentImage.dpiRating === 'optima' ? 'text-emerald-600'
                  : currentImage.dpiRating === 'buena' ? 'text-amber-600'
                  : 'text-rose-500'
                }`} />
                <span>Calidad @ {dpiMode} DPI:</span>
              </span>
              <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                currentImage.dpiRating === 'optima' ? 'bg-emerald-100 text-emerald-800'
                : currentImage.dpiRating === 'buena' ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
              }`}>
                {currentImage.dpiRating === 'optima' ? 'Alta' : currentImage.dpiRating === 'buena' ? 'Media' : 'Baja'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sample Designs */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-display font-semibold text-sm text-stone-900">
              O prueba con un diseño de muestra
            </h3>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">Panorámicos</span>
        </div>
        <p className="text-xs text-stone-500 mb-3">
          Prueba al instante cómo se adapta un diseño panorámico a las proporciones de la taza:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SAMPLE_DESIGNS.map((sample) => (
            <button
              key={sample.id}
              id={`sample-btn-${sample.id}`}
              type="button"
              onClick={() => loadSample(sample)}
              className="flex flex-col text-left p-2.5 rounded-xl border border-stone-200 hover:border-indigo-400 hover:bg-stone-50 active:bg-stone-100 transition-all cursor-pointer group"
            >
              <div className="w-full h-14 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 mb-2 relative">
                <img
                  src={sample.dataUrl}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <span className="text-xs font-semibold text-stone-900 truncate w-full">{sample.name}</span>
              <span className="text-[10px] text-stone-500 truncate w-full">{sample.category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
