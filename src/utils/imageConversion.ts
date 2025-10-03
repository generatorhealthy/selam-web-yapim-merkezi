/**
 * WebP image conversion utilities
 */

/**
 * Convert an image file to WebP format
 * @param file - Original image file
 * @param quality - WebP quality (0-1), default 0.85
 * @returns Promise<File> - WebP file
 */
export const convertToWebP = async (
  file: File,
  quality: number = 0.85
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Skip if already WebP
    if (file.type === 'image/webp') {
      resolve(file);
      return;
    }

    // Create image element
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Set canvas dimensions to image dimensions
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw image to canvas
      ctx.drawImage(img, 0, 0);

      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image'));
            return;
          }

          // Create new file with WebP extension
          const originalName = file.name.replace(/\.[^/.]+$/, '');
          const webpFile = new File([blob], `${originalName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Check if browser supports WebP
 * @returns boolean
 */
export const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

/**
 * Get optimized file size estimate
 * @param originalSize - Original file size in bytes
 * @returns Estimated WebP size in bytes
 */
export const getEstimatedWebPSize = (originalSize: number): number => {
  // WebP typically reduces file size by 25-35%
  return Math.round(originalSize * 0.7);
};
