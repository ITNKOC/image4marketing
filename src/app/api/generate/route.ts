import { NextRequest, NextResponse } from 'next/server';
import { generateRequestSchema } from '@/lib/zod-schemas';
import { generateImages } from '@/lib/ai-client';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';

// Marquer cette route comme dynamique pour éviter l'exécution pendant le build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimit(identifier, 'generate');

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Trop de requêtes, veuillez réessayer plus tard',
          limit: rateLimitResult.limit,
          remaining: 0,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const body = await request.json();

    // Validation Zod
    const validation = generateRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? 'Données invalides' },
        { status: 400 }
      );
    }

    const { imageUrl, stylePrompt } = validation.data;

    // Appel au client IA
    const generatedImages = await generateImages({ imageUrl, stylePrompt });

    // Créer une session dans la base de données
    const session = await prisma.session.create({
      data: {
        uploadId: `upload-${Date.now()}`,
        originalImage: imageUrl,
        images: {
          create: generatedImages.map((img) => ({
            url: img.url,
            prompt: img.prompt,
            isFinal: false,
            isValidated: false,
          })),
        },
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      images: session.images.map((img) => ({
        id: img.id,
        url: img.url,
        prompt: img.prompt,
        createdAt: img.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Erreur génération:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération des images' },
      { status: 500 }
    );
  }
}
