import { ImageTransform, FitMode } from '../types';

export const CANVAS_WIDTH_CM = 20.0;
export const CANVAS_HEIGHT_CM = 9.5;
export const CANVAS_ASPECT_RATIO = CANVAS_WIDTH_CM / CANVAS_HEIGHT_CM; // 20 / 9.5 = 2.105263

// Supported DPI modes
export type DpiMode = 72 | 150 | 300;

/**
 * Given image pixel dimensions and a target DPI, compute its physical size in cm.
 * Formula: cm = (px / dpi) * 2.54
 */
export function pixelsToCm(px: number, dpi: DpiMode): number {
  return (px / dpi) * 2.54;
}

/**
 * Computes the initial transform for an image placed at its physical size
 * derived from pixel dimensions + selected DPI.
 *
 * - If the physical size fits inside the print area, place it centered at that size.
 * - If it's larger than the print area in any dimension, fall back to contain.
 *
 * Returns percentages (0–100) for x, y, width, height relative to the 20×9.5 cm canvas.
 */
export function computeInitialTransformByDpi(
  imgWidthPx: number,
  imgHeightPx: number,
  dpi: DpiMode
): ImageTransform {
  const safeW = Math.max(1, imgWidthPx);
  const safeH = Math.max(1, imgHeightPx);

  const physicalWidthCm = pixelsToCm(safeW, dpi);
  const physicalHeightCm = pixelsToCm(safeH, dpi);

  // Convert physical cm to % of canvas
  const widthPct = (physicalWidthCm / CANVAS_WIDTH_CM) * 100;
  const heightPct = (physicalHeightCm / CANVAS_HEIGHT_CM) * 100;

  // If image fits inside the printable area at its physical size, place it centered
  if (widthPct <= 100 && heightPct <= 100) {
    const x = (100 - widthPct) / 2;
    const y = (100 - heightPct) / 2;
    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      width: Number(widthPct.toFixed(2)),
      height: Number(heightPct.toFixed(2)),
    };
  }

  // Falls back to contain (scale down proportionally to fit)
  return computeInitialTransform(safeW, safeH, 'contain');
}

/**
 * Computes the initial placement of an image inside the 20x9.5cm canvas based on fit mode.
 * Returns percentages (0-100%) for x, y, width, and height.
 */
export function computeInitialTransform(
  imgWidth: number,
  imgHeight: number,
  fitMode: FitMode = 'contain'
): ImageTransform {
  const safeImgWidth = Math.max(1, imgWidth || 1);
  const safeImgHeight = Math.max(1, imgHeight || 1);
  const imgAspectRatio = safeImgWidth / safeImgHeight;

  if (fitMode === 'stretch') {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  if (fitMode === 'cover') {
    if (imgAspectRatio > CANVAS_ASPECT_RATIO) {
      // Wider than canvas: height is 100%, width scales up to cover
      const width = 100 * (imgAspectRatio / CANVAS_ASPECT_RATIO);
      const height = 100;
      return {
        x: (100 - width) / 2,
        y: 0,
        width,
        height,
      };
    } else {
      // Taller than canvas: width is 100%, height scales up to cover
      const width = 100;
      const height = 100 * (CANVAS_ASPECT_RATIO / imgAspectRatio);
      return {
        x: 0,
        y: (100 - height) / 2,
        width,
        height,
      };
    }
  }

  // Default 'contain': image fits entirely within 100% width and 100% height
  if (imgAspectRatio > CANVAS_ASPECT_RATIO) {
    // Wider: 100% width, height proportional
    const width = 100;
    const height = 100 * (CANVAS_ASPECT_RATIO / imgAspectRatio);
    return {
      x: 0,
      y: (100 - height) / 2,
      width,
      height,
    };
  } else {
    // Taller or square: 100% height, width proportional
    const height = 100;
    const width = 100 * (imgAspectRatio / CANVAS_ASPECT_RATIO);
    return {
      x: (100 - width) / 2,
      y: 0,
      width,
      height,
    };
  }
}

/**
 * Scales an existing transform by a relative multiplier (e.g. 1.05 or 0.95), keeping its center anchor.
 */
export function scaleTransformByFactor(
  current: ImageTransform,
  factor: number,
  imgWidth: number,
  imgHeight: number
): ImageTransform {
  const safeImgWidth = Math.max(1, imgWidth || 1);
  const safeImgHeight = Math.max(1, imgHeight || 1);
  const imgAspect = safeImgWidth / safeImgHeight;

  // New width clamped between 5% and 400%
  const newWidth = Math.min(400, Math.max(5, current.width * factor));
  // Keep physical aspect ratio:
  // newWidth_cm = (newWidth / 100) * CANVAS_WIDTH_CM
  // newHeight_cm = newWidth_cm / imgAspect
  // newHeight = (newHeight_cm / CANVAS_HEIGHT_CM) * 100
  const newHeight = newWidth * (CANVAS_ASPECT_RATIO / imgAspect);

  // Keep center anchor position
  const centerX = current.x + current.width / 2;
  const centerY = current.y + current.height / 2;

  return {
    width: Number(newWidth.toFixed(2)),
    height: Number(newHeight.toFixed(2)),
    x: Number((centerX - newWidth / 2).toFixed(2)),
    y: Number((centerY - newHeight / 2).toFixed(2)),
  };
}

/**
 * Formats canvas percentage coordinates into real centimeters for the user.
 */
export function transformToCentimeters(transform: ImageTransform) {
  const widthCm = Number(((transform.width / 100) * CANVAS_WIDTH_CM).toFixed(1));
  const heightCm = Number(((transform.height / 100) * CANVAS_HEIGHT_CM).toFixed(1));
  const xCm = Number(((transform.x / 100) * CANVAS_WIDTH_CM).toFixed(1));
  const yCm = Number(((transform.y / 100) * CANVAS_HEIGHT_CM).toFixed(1));

  return { widthCm, heightCm, xCm, yCm };
}
