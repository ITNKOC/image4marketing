import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Cache les réponses pendant 30 secondes
export const revalidate = 30;

export async function GET(req: NextRequest) {
  try {
    // Vérifier que l'utilisateur est authentifié
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder aux images' },
        { status: 401 }
      );
    }

    // Pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Récupérer les images avec pagination
    const [images, total] = await Promise.all([
      prisma.image.findMany({
        take: limit,
        skip: skip,
        include: {
          session: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc', // Les plus récentes en premier
        },
      }),
      prisma.image.count(), // Total pour la pagination
    ]);

    // Formater les données pour le frontend
    const formattedImages = images.map((image) => ({
      id: image.id,
      url: image.url,
      prompt: image.prompt,
      createdAt: image.createdAt,
      sessionId: image.sessionId,
      user: image.session.user
        ? {
            id: image.session.user.id,
            username: image.session.user.username,
          }
        : {
            id: 'anonymous',
            username: 'Anonyme',
          },
    }));

    return NextResponse.json(
      {
        images: formattedImages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + images.length < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des images' },
      { status: 500 }
    );
  }
}
