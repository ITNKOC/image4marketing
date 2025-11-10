import { NextRequest, NextResponse } from 'next/server';
import { generateRequestSchema } from '@/lib/zod-schemas';
import { generateImages } from '@/lib/ai-client';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { uploadOriginalImage, uploadGeneratedImage } from '@/lib/cloudinary';

// Marquer cette route comme dynamique pour éviter l'exécution pendant le build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Récupérer l'utilisateur authentifié
    const session = await auth();
    const userId = session?.user?.id || null;
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

    // 1. Upload l'image originale vers Cloudinary
    console.log('[API] Upload de l\'image originale vers Cloudinary...');
    const cloudinaryOriginalUrl = await uploadOriginalImage(imageUrl);
    console.log('[API] Image originale uploadée:', cloudinaryOriginalUrl);

    // 2. Appel au client IA pour générer les images
    const generatedImages = await generateImages({ imageUrl, stylePrompt });

    // 3. Upload toutes les images générées vers Cloudinary
    console.log('[API] Upload des images générées vers Cloudinary...');
    const uploadedImages = await Promise.all(
      generatedImages.map(async (img) => {
        const cloudinaryUrl = await uploadGeneratedImage(img.url);
        return {
          url: cloudinaryUrl,
          prompt: img.prompt,
        };
      })
    );
    console.log('[API] Toutes les images uploadées sur Cloudinary');

    // 4. Créer une session dans la base de données avec les URLs Cloudinary
    const dbSession = await prisma.session.create({
      data: {
        uploadId: `upload-${Date.now()}`,
        originalImage: cloudinaryOriginalUrl, // URL Cloudinary au lieu de base64
        userId, // Lier à l'utilisateur si authentifié
        images: {
          create: uploadedImages.map((img) => ({
            url: img.url, // URL Cloudinary au lieu de base64
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
      sessionId: dbSession.id,
      images: dbSession.images.map((img) => ({
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
