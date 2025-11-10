import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload une image vers Cloudinary
 * @param imageData - Peut être une data URL base64, une URL http(s), ou un buffer
 * @param folder - Dossier dans Cloudinary (par défaut: image4marketing)
 * @returns L'URL publique de l'image uploadée
 */
export async function uploadToCloudinary(
  imageData: string,
  folder: string = 'image4marketing'
): Promise<string> {
  try {
    // Upload l'image vers Cloudinary
    const result = await cloudinary.uploader.upload(imageData, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }, // Optimisation automatique
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error('[Cloudinary] Erreur upload:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Upload une image originale (depuis l'utilisateur)
 */
export async function uploadOriginalImage(imageData: string): Promise<string> {
  return uploadToCloudinary(imageData, 'image4marketing/originals');
}

/**
 * Upload une image générée par l'IA
 */
export async function uploadGeneratedImage(imageData: string): Promise<string> {
  return uploadToCloudinary(imageData, 'image4marketing/generated');
}

/**
 * Supprime une image de Cloudinary
 * @param publicId - L'ID public de l'image (extrait de l'URL)
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('[Cloudinary] Erreur suppression:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Extrait le public_id depuis une URL Cloudinary
 * Exemple: https://res.cloudinary.com/djin03bhl/image/upload/v1234/folder/image.jpg
 * => folder/image
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    const matches = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return matches && matches[1] ? matches[1] : null;
  } catch {
    return null;
  }
}
