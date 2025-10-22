import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SharePageProps {
  params: {
    sessionId: string;
    imageId: string;
  };
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const image = await prisma.image.findFirst({
    where: {
      id: params.imageId,
      sessionId: params.sessionId,
      isValidated: true,
    },
  });

  if (!image) {
    return {
      title: 'Image non trouvée',
    };
  }

  return {
    title: 'Image Marketing - Image4Marketing',
    description: image.prompt,
    openGraph: {
      title: 'Image Marketing - Image4Marketing',
      description: image.prompt,
      images: [image.url],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Image Marketing - Image4Marketing',
      description: image.prompt,
      images: [image.url],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const image = await prisma.image.findFirst({
    where: {
      id: params.imageId,
      sessionId: params.sessionId,
      isValidated: true,
    },
    include: {
      session: true,
    },
  });

  if (!image) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-slate-800 mb-4">
            Image4Marketing
          </h1>
          <p className="text-lg text-slate-600">
            Image marketing générée par IA
          </p>
        </header>

        {/* Image Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Image principale */}
          <div className="relative w-full h-[600px] bg-slate-100">
            <Image
              src={image.url}
              alt={image.prompt}
              fill
              className="object-contain"
              priority
              sizes="100vw"
            />
          </div>

          {/* Informations */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-800 mb-2">
                  Description
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {image.prompt}
                </p>
              </div>
            </div>

            {/* Métadonnées */}
            <div className="border-t border-slate-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700">Créée le :</span>
                  <span className="ml-2 text-slate-600">
                    {new Date(image.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">ID :</span>
                  <span className="ml-2 text-slate-600 font-mono text-xs">
                    {image.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <a
                href={image.url}
                download
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-center flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Télécharger
              </a>
              <a
                href="/"
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors text-center"
              >
                Créer la vôtre
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-slate-500 text-sm">
          <p>
            Généré avec{' '}
            <a href="/" className="text-primary-600 hover:underline">
              Image4Marketing
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
