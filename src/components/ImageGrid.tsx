'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useImageStore } from '@/store/image-store';
import ModifyDialog from './ModifyDialog';
import { gridContainerVariants, gridItemVariants, cardHoverVariants } from '@/lib/animations';

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
          {generatedImages.map((image, index) => (
            <motion.div
              key={image.id}
              variants={gridItemVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className="group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200"
            >
              <div className="relative h-72 w-full bg-slate-100">
                <Image
                  src={image.url}
                  alt={image.prompt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index < 2}
                />
              </div>

              <div className="p-4">
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                  {image.prompt}
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
          ))}
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
