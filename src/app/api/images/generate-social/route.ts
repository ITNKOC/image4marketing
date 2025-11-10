import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateSocialMediaPost } from '@/lib/ai-client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour générer du contenu' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { imageUrl, userDescription } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL de l\'image requise' },
        { status: 400 }
      );
    }

    // Générer le contenu social media basé sur l'analyse de l'image
    const socialContent = await generateSocialMediaPost(imageUrl, userDescription);

    return NextResponse.json(
      {
        success: true,
        content: socialContent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la génération du contenu:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la génération du contenu social media',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
