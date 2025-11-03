'use client';

import { motion } from 'framer-motion';
import { useImageStore } from '@/store/image-store';
import UploadArea from '@/components/UploadArea';
import ImageGrid from '@/components/ImageGrid';
import LoadingSpinner from '@/components/LoadingSpinner';
import ChatModification from '@/components/ChatModification';
import FinalCard from '@/components/FinalCard';
import toast from 'react-hot-toast';

export default function HomePage() {
  const currentStep = useImageStore((state) => state.currentStep);
  const uploadedImage = useImageStore((state) => state.uploadedImage);
  const isLoading = useImageStore((state) => state.isLoading);
  const startGeneration = useImageStore((state) => state.startGeneration);
  const setGeneratedImages = useImageStore((state) => state.setGeneratedImages);
  const setError = useImageStore((state) => state.setError);
  const reset = useImageStore((state) => state.reset);

  const handleGenerate = async () => {
    if (!uploadedImage) {
      toast.error('Aucune image uploadée');
      return;
    }

    startGeneration();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadedImage.url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Erreur lors de la génération');
      }

      const data = await response.json();
      setGeneratedImages(data.sessionId, data.images);
      toast.success('Images générées avec succès !');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-16 md:py-24">
        {/* Header moderne minimaliste */}
        <motion.header
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8 flex justify-center">
            <motion.img
              src="/logo/logo i4m.svg"
              alt="Image4Marketing"
              className="h-16 md:h-20 w-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            />
          </div>

          <motion.h1
            className="text-4xl md:text-6xl font-bold text-black mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Transformez vos images
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Générez des visuels marketing professionnels en quelques secondes grâce à l'intelligence artificielle
          </motion.p>

          {/* Stats/Features badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span>IA Générative</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span>4 Variantes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <span>Résultats Instantanés</span>
            </div>
          </motion.div>
        </motion.header>

        {/* Progress indicator minimaliste */}
        {currentStep !== 'upload' && (
          <motion.div
            className="flex justify-center items-center gap-3 mb-16 max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {[
              { key: 'upload', label: '1' },
              { key: 'generate', label: '2' },
              { key: 'modify', label: '3' },
              { key: 'chat', label: '4' },
              { key: 'final', label: '5' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold smooth-transition
                    ${currentStep === step.key ||
                      (['chat', 'final'].includes(currentStep) && ['upload', 'generate', 'modify'].includes(step.key)) ||
                      (currentStep === 'final' && step.key === 'chat')
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-400'
                    }
                  `}
                >
                  {step.label}
                </div>
                {index < 4 && (
                  <div className="w-12 md:w-16 h-0.5 mx-2 bg-gray-200">
                    <div
                      className={`h-full smooth-transition bg-black ${
                        (['chat', 'final'].includes(currentStep) && index < 3) ||
                        (currentStep === 'final' && index === 3)
                          ? 'w-full'
                          : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {currentStep === 'upload' && <UploadArea />}

          {currentStep === 'generate' && !isLoading && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <button
                onClick={handleGenerate}
                className="px-12 py-4 bg-black text-white text-lg font-semibold rounded-xl hover:bg-gray-800 smooth-transition inline-flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Générer les images marketing
              </button>
              <p className="mt-6 text-sm text-gray-500">
                4 variantes seront créées automatiquement
              </p>
            </motion.div>
          )}

          {isLoading && <LoadingSpinner text="Génération en cours..." />}

          {currentStep === 'modify' && <ImageGrid />}

          {currentStep === 'chat' && <ChatModification />}

          {currentStep === 'final' && <FinalCard />}

          {/* Reset Button */}
          {currentStep !== 'upload' && currentStep !== 'final' && currentStep !== 'chat' && (
            <motion.div
              className="text-center pt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={reset}
                className="text-sm font-medium text-gray-600 hover:text-black smooth-transition inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recommencer
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
