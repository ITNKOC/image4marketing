import { NextRequest, NextResponse } from 'next/server';
import { validateRequestSchema } from '@/lib/zod-schemas';
import { prisma } from '@/lib/prisma';
import { generateSocialMediaPost } from '@/lib/ai-client';

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

    // Vérifier si c'est une image social media et générer le texte automatiquement
    const isSocialMediaImage = validatedImage.prompt.toLowerCase().includes('social media')
      || validatedImage.prompt.toLowerCase().includes('instagram')
      || validatedImage.prompt.toLowerCase().includes('facebook');

    let socialMediaPost = null;

    if (isSocialMediaImage) {
      try {
        console.log('[Validate] Génération du texte social media avec analyse d\'image...');
        // Passer l'URL de l'image pour l'analyse visuelle
        socialMediaPost = await generateSocialMediaPost(validatedImage.url);
        console.log('[Validate] Texte généré avec succès basé sur l\'analyse de l\'image');
      } catch (error) {
        console.error('[Validate] Erreur génération texte social media:', error);
        // On continue même si la génération échoue
      }
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      shareUrl,
      image: {
        id: validatedImage.id,
        url: validatedImage.url,
        prompt: validatedImage.prompt,
      },
      socialMediaPost, // Sera null si ce n'est pas une image social media
    });
  } catch (error) {
    console.error('Erreur validation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation de l\'image' },
      { status: 500 }
    );
  }
}
