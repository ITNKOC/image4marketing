import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { generateId } from '@/lib/utils';
import { uploadOriginalImage } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validation des types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format de fichier non supporté' },
        { status: 400 }
      );
    }

    // Validation de la taille (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Le fichier dépasse la taille maximale de 10MB' },
        { status: 400 }
      );
    }

    // Générer un ID unique pour le tracking
    const uploadId = generateId();

    // Convertir le fichier en buffer et l'optimiser avec sharp
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Obtenir les métadonnées et optimiser l'image
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Optimiser l'image
    const optimizedBuffer = await image
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Convertir en base64 pour l'upload vers Cloudinary
    const base64Image = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;

    // Upload vers Cloudinary (au lieu du filesystem)
    console.log('[Upload API] Upload vers Cloudinary...');
    const imageUrl = await uploadOriginalImage(base64Image);
    console.log('[Upload API] Image uploadée:', imageUrl);

    return NextResponse.json({
      uploadId,
      imageUrl,
      metadata: {
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
        format: metadata.format ?? 'unknown',
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
}
