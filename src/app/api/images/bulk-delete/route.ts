import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour supprimer des images' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { imageIds } = body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'Liste d\'images vide' },
        { status: 400 }
      );
    }

    // Vérifier que toutes les images appartiennent à l'utilisateur
    const images = await prisma.image.findMany({
      where: {
        id: {
          in: imageIds,
        },
      },
      include: {
        session: {
          select: {
            userId: true,
          },
        },
      },
    });

    // Vérifier les permissions
    const unauthorizedImages = images.filter(
      (image) => image.session.userId !== session.user.id
    );

    if (unauthorizedImages.length > 0) {
      return NextResponse.json(
        {
          error: `Vous n'êtes pas autorisé à supprimer ${unauthorizedImages.length} image${unauthorizedImages.length > 1 ? 's' : ''}`,
        },
        { status: 403 }
      );
    }

    // Supprimer les images
    const result = await prisma.image.deleteMany({
      where: {
        id: {
          in: imageIds,
        },
        session: {
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${result.count} image${result.count > 1 ? 's' : ''} supprimée${result.count > 1 ? 's' : ''}`,
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression en masse:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression en masse' },
      { status: 500 }
    );
  }
}
