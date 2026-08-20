const MAX_IMAGES = 4;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Parse the car `image` field into an array of image URLs.
 *
 * The field may contain:
 *  - A JSON-serialised string array (multi-image storage)
 *  - A plain URL string (legacy single-image)
 *  - An empty string or undefined (no images)
 *
 * Returns an array of image URL strings.
 */
export function parseCarImages(image?: string | null): string[] {
  if (!image) return [];

  try {
    const parsed: unknown = JSON.parse(image);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed as string[];
    }
  } catch {
    // Not valid JSON -- fall through to plain-URL handling
  }

  return [image];
}

/**
 * Serialize an array of image URLs into the JSON string stored in the
 * car `image` field. Returns an empty string when there are no images.
 */
export function serializeCarImages(images: string[]): string {
  if (images.length === 0) return '';
  if (images.length === 1) return JSON.stringify(images);
  return JSON.stringify(images);
}

/**
 * Validate a file before it is read. Returns an error message string
 * when the file is invalid, or `null` when the file is acceptable.
 */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}" is not a supported format. Use JPEG, PNG, or WebP.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" exceeds the 2 MB size limit.`;
  }
  return null;
}

const COMPRESS_MAX_DIMENSION = 1600; // px, long edge
const COMPRESS_JPEG_QUALITY = 0.8;

/**
 * Resize an image file to at most `maxDimension` on its long edge and
 * re-encode it as JPEG, returning a base64 data-URL — client-side, before
 * it's ever serialized into the multi-image field. A typical 2MB phone
 * photo becomes a few hundred KB; four of them stay well under the
 * server's body-size limit instead of pushing a ~10MB request. Runs
 * independent of (and stays useful regardless of) any future move to
 * real object storage on the backend.
 */
export function compressImage(
  file: File,
  maxDimension = COMPRESS_MAX_DIMENSION,
  quality = COMPRESS_JPEG_QUALITY,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });
}

export { MAX_IMAGES, MAX_FILE_SIZE_BYTES, ACCEPTED_IMAGE_TYPES };
