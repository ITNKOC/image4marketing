'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useImageStore } from '@/store/image-store';
import ModifyDialog from './ModifyDialog';

interface ImageLabel {
  title: string;
  description: string;
  badge: string;
}

const IMAGE_LABELS: ImageLabel[] = [
  {
    title: 'E-commerce',
    description: 'Image retouchée professionnellement - Fond blanc pur - Qualité catalogue',
    badge: 'Site Web',
  },
  {
    title: 'Livraison',
    description: 'Vue d\'en haut (overhead) - Background premium - Optimisé Uber Eats/DoorDash',
    badge: 'Apps Livraison',
  },
  {
    title: 'Réseaux Sociaux',
    description: 'Publication Instagram & Facebook - Texte auto-généré après validation',
    badge: 'Social Media',
  },
  {
    title: 'Hero',
    description: 'Image pure sans texte - Format 16:9 - Qualité éditoriale',
    badge: 'Page d\'Accueil',
  }
];

const DEFAULT_LABEL: ImageLabel = {
  title: 'Image Générée',
  description: 'Image générée par IA',
  badge: 'Généré',
};

export default function ImageGrid() {
  const generatedImages = useImageStore((state) => state.generatedImages);
  const selectImageForChat = useImageStore((state) => state.selectImageForChat);
  const [modifyingImage, setModifyingImage] = useState<{
    id: string;
    url: string;
    prompt: string;
  } | null>(null);

  if (generatedImages.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        className="w-full max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-black mb-6">
          Vos images générées
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {generatedImages.map((image, index) => {
            const label: ImageLabel = IMAGE_LABELS[index] ?? DEFAULT_LABEL;
            return (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-black smooth-transition hover-lift"
              >
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-semibold">
                    {label.badge}
                  </span>
                </div>

                <div className="relative h-72 w-full bg-gray-100">
                  <Image
                    src={image.url}
                    alt={label.description}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index < 2}
                  />
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold text-black mb-1">
                    {label.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {label.description}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => selectImageForChat(image.id)}
                      className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 smooth-transition"
                    >
                      Choisir
                    </button>
                    <button
                      onClick={() => setModifyingImage(image)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 smooth-transition"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {modifyingImage && (
        <ModifyDialog
          isOpen={true}
          onClose={() => setModifyingImage(null)}
          imageId={modifyingImage.id}
          imageUrl={modifyingImage.url}
          currentPrompt={modifyingImage.prompt}
        />
      )}
    </>
  );
}
