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

/**
 * Read a File as a base64 data-URL string.
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not return a string'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export { MAX_IMAGES, MAX_FILE_SIZE_BYTES, ACCEPTED_IMAGE_TYPES };
