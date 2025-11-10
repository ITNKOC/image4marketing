import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour supprimer une image' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json(
        { error: 'ID de l\'image requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'image existe et appartient à l'utilisateur
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      include: {
        session: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de l'image
    if (image.session.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à supprimer cette image' },
        { status: 403 }
      );
    }

    // Supprimer l'image de la base de données
    await prisma.image.delete({
      where: { id: imageId },
    });

    return NextResponse.json(
      { success: true, message: 'Image supprimée avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'image' },
      { status: 500 }
    );
  }
}
