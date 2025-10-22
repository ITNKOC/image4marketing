import { NextRequest, NextResponse } from 'next/server';
import { regenerateRequestSchema } from '@/lib/zod-schemas';
import { regenerateImage } from '@/lib/ai-client';
import { prisma } from '@/lib/prisma';

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
      originalImage.prompt,
      userPrompt
    );

    // Mettre à jour l'image dans la base de données
    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: {
        url: regeneratedImageData.url,
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
