import { NextRequest, NextResponse } from 'next/server';
import { validateRequestSchema } from '@/lib/zod-schemas';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation Zod
    const validation = validateRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? 'Données invalides' },
        { status: 400 }
      );
    }

    const { sessionId, finalImageId } = validation.data;

    // Vérifier que l'image appartient à la session
    const image = await prisma.image.findFirst({
      where: {
        id: finalImageId,
        sessionId: sessionId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image non trouvée ou ne correspond pas à la session' },
        { status: 404 }
      );
    }

    // Mettre à jour l'image comme validée et finale
    const validatedImage = await prisma.image.update({
      where: { id: finalImageId },
      data: {
        isFinal: true,
        isValidated: true,
      },
    });

    // Générer les URLs de téléchargement et de partage
    const downloadUrl = validatedImage.url;
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/share/${sessionId}/${finalImageId}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      shareUrl,
      image: {
        id: validatedImage.id,
        url: validatedImage.url,
        prompt: validatedImage.prompt,
      },
    });
  } catch (error) {
    console.error('Erreur validation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation de l\'image' },
      { status: 500 }
    );
  }
}
