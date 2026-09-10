import { ImageTransform, FitMode } from '../types';

export const CANVAS_WIDTH_CM = 20.0;
export const CANVAS_HEIGHT_CM = 9.5;
export const CANVAS_ASPECT_RATIO = CANVAS_WIDTH_CM / CANVAS_HEIGHT_CM; // 20 / 9.5 = 2.105263

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
