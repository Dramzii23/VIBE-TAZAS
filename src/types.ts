export interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string;
  sizeBytes: number;
  sizeFormatted: string;
  width: number;
  height: number;
  aspectRatio: number;
  dpiRating: 'optima' | 'buena' | 'baja';
  dpiRatingText: string;
  uploadedAt: string;
}

export type FitMode = 'contain' | 'cover' | 'stretch' | 'original';

export interface DesignCanvasSettings {
  fitMode: FitMode;
  showGuides: boolean;
  showRulers: boolean;
  showZones: boolean;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  backgroundColor: string;
}

export interface MugSpecification {
  name: string;
  material: string;
  capacity: string;
  diameterCm: number;
  heightCm: number;
  printWidthCm: number;
  printHeightCm: number;
  printWidthPx: number; // At 300 DPI: 20 cm / 2.54 * 300 ~ 2362 px
  printHeightPx: number; // At 300 DPI: 9.5 cm / 2.54 * 300 ~ 1122 px
  safeMarginCm: number;
}

export const STANDARD_MUG_SPEC: MugSpecification = {
  name: 'Taza Cerámica Clásica 11 oz',
  material: 'Cerámica brillante blanca de alta resistencia',
  capacity: '11 oz / 325 ml',
  diameterCm: 8.2,
  heightCm: 9.6,
  printWidthCm: 20.0,
  printHeightCm: 9.5,
  printWidthPx: 2362,
  printHeightPx: 1122,
  safeMarginCm: 0.5,
};
