const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

/**
 * Generates a complete image URL from the database name.
 * @param imageName The name of the image stored in the database (e.g., "bild-1234").
 * @returns The full URL of the image.
 */
export const getImageUrl = (imageName: string): string => {
  if (!imageName) {
    throw new Error("Image name is required to generate the URL.");
  }
  return `${BASE_IMAGE_URL}${imageName}${DEFAULT_IMAGE_EXTENSION}`;
};
