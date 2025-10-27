'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useImageStore } from '@/store/image-store';
import ModifyDialog from './ModifyDialog';
import { gridContainerVariants, gridItemVariants, cardHoverVariants } from '@/lib/animations';

// Type pour les labels d'images
interface ImageLabel {
  title: string;
  description: string;
  badge: string;
  color: string;
}

// Labels et descriptions pour chaque type d'image
const IMAGE_LABELS: ImageLabel[] = [
  {
    title: '🛒 E-commerce Parfait',
    description: 'Image retouchée professionnellement - Fond blanc pur - Qualité catalogue',
    badge: 'Site Web',
    color: 'bg-blue-100 text-blue-700'
  },
  {
    title: '🚗 Livraison Pro',
    description: 'Vue d\'en haut (overhead) - Background premium - Optimisé Uber Eats/DoorDash',
    badge: 'Apps Livraison',
    color: 'bg-green-100 text-green-700'
  },
  {
    title: '📱 Réseaux Sociaux',
    description: 'Publication Instagram & Facebook - Texte auto-généré après validation',
    badge: 'Social Media',
    color: 'bg-pink-100 text-pink-700'
  },
  {
    title: '⭐ Hero Cinématique',
    description: 'Image pure sans texte - Format 16:9 - Qualité éditoriale Michelin',
    badge: 'Page d\'Accueil',
    color: 'bg-purple-100 text-purple-700'
  }
];

// Label par défaut au cas où l'index serait hors limites
const DEFAULT_LABEL: ImageLabel = {
  title: '🎨 Image Générée',
  description: 'Image générée par IA',
  badge: 'Généré',
  color: 'bg-gray-100 text-gray-700'
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
        initial="hidden"
        animate="show"
        variants={gridContainerVariants}
      >
        <motion.h2
          className="text-2xl font-display font-bold text-slate-800 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Vos images générées
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={gridContainerVariants}
        >
          {generatedImages.map((image, index) => {
            const label: ImageLabel = IMAGE_LABELS[index] ?? DEFAULT_LABEL;
            return (
              <motion.div
                key={image.id}
                variants={gridItemVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className="group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200"
              >
                {/* Badge de type */}
                <div className="absolute top-4 left-4 z-10">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-md ${label.color}`}>
                    {label.badge}
                  </span>
                </div>

                <div className="relative h-72 w-full bg-slate-100">
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
                  {/* Titre et description */}
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    {label.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {label.description}
                  </p>

                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => selectImageForChat(image.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Choisir
                    </motion.button>
                    <motion.button
                      onClick={() => setModifyingImage(image)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                    >
                      Modifier
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
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
