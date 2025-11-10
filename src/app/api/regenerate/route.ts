import { NextRequest, NextResponse } from 'next/server';
import { regenerateRequestSchema } from '@/lib/zod-schemas';
import { regenerateImage } from '@/lib/ai-client';
import { prisma } from '@/lib/prisma';
import { uploadGeneratedImage } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation Zod
    const validation = regenerateRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? 'Données invalides' },
        { status: 400 }
      );
    }

    const { sessionId, imageId, userPrompt } = validation.data;

    // Récupérer l'image originale
    const originalImage = await prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!originalImage) {
      return NextResponse.json(
        { error: 'Image non trouvée' },
        { status: 404 }
      );
    }

    // Régénérer l'image avec le nouveau prompt
    const regeneratedImageData = await regenerateImage(
      originalImage.url,
      originalImage.prompt,
      userPrompt
    );

    // Upload l'image régénérée vers Cloudinary
    console.log('[Regenerate API] Upload de l\'image régénérée vers Cloudinary...');
    const cloudinaryUrl = await uploadGeneratedImage(regeneratedImageData.url);
    console.log('[Regenerate API] Image uploadée:', cloudinaryUrl);

    // Mettre à jour l'image dans la base de données avec l'URL Cloudinary
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: {
        url: cloudinaryUrl, // URL Cloudinary au lieu de base64
        prompt: regeneratedImageData.prompt,
      },
    });

    return NextResponse.json({
      imageId: updatedImage.id,
      newImageUrl: updatedImage.url,
      newPrompt: updatedImage.prompt,
    });
  } catch (error) {
    console.error('Erreur régénération:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la régénération de l\'image' },
      { status: 500 }
    );
  }
}
