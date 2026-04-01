/**
 * Converts a stored image_path (filename only) into a full URL
 * the frontend can use directly in an <img> src attribute.
 *
 * If the product has no image, returns the URL for the default placeholder.
 *
 * Examples:
 *   imageUrl('1700000000000-keyboard.jpg') → '/images/1700000000000-keyboard.jpg'
 *   imageUrl(null)                          → '/images/default.png'
 */
export function imageUrl(imagePath: string | null): string {
  if (!imagePath) return '/images/default.png';
  return `/images/${imagePath}`;
}