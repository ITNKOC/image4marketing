import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour télécharger des images' },
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

    // Récupérer les images depuis la base de données
    const images = await prisma.image.findMany({
      where: {
        id: {
          in: imageIds,
        },
      },
      select: {
        id: true,
        url: true,
        prompt: true,
      },
    });

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Aucune image trouvée' },
        { status: 404 }
      );
    }

    // Créer un ZIP
    const zip = new JSZip();

    // Télécharger chaque image et l'ajouter au ZIP
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (!image) continue;

      try {
        const response = await fetch(image.url);
        if (!response.ok) {
          console.error(`Failed to fetch image ${image.id}`);
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Déterminer l'extension du fichier
        const extension = image.url.includes('.png') ? 'png' : 'jpg';
        const filename = `image-${i + 1}-${image.id.substring(0, 8)}.${extension}`;

        zip.file(filename, buffer);
      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error);
        // Continue avec les autres images
      }
    }

    // Générer le ZIP en tant que Blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Retourner le ZIP
    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="images-${Date.now()}.zip"`,
      },
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement en masse:', error);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement en masse' },
      { status: 500 }
    );
  }
}
