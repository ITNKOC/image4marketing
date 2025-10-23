'use client';

import { motion } from 'framer-motion';
import { useImageStore } from '@/store/image-store';
import UploadArea from '@/components/UploadArea';
import ImageGrid from '@/components/ImageGrid';
import LoadingSpinner from '@/components/LoadingSpinner';
import ChatModification from '@/components/ChatModification';
import FinalCard from '@/components/FinalCard';
import toast from 'react-hot-toast';
import { fadeInUpVariants } from '@/lib/animations';

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
    <main className="min-h-screen relative overflow-hidden">
      {/* Background avec gradient moderne */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200/20 via-transparent to-transparent -z-10" />

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header moderne avec glassmorphism */}
        <motion.header
          className="text-center mb-12 md:mb-16"
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariants}
        >
          <div className="inline-block mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-2xl opacity-20 rounded-full" />
              <h1 className="relative text-4xl md:text-6xl lg:text-7xl font-display font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                Image4Marketing
              </h1>
            </div>
          </div>

          <motion.p
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Transformez vos photos de plats en images marketing professionnelles grâce à l'IA
          </motion.p>

          {/* Badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="px-4 py-2 bg-white/60 backdrop-blur-lg rounded-full text-sm font-medium text-indigo-700 border border-indigo-200 shadow-sm">
              ✨ IA Générative
            </span>
            <span className="px-4 py-2 bg-white/60 backdrop-blur-lg rounded-full text-sm font-medium text-purple-700 border border-purple-200 shadow-sm">
              🎨 4 Variantes
            </span>
            <span className="px-4 py-2 bg-white/60 backdrop-blur-lg rounded-full text-sm font-medium text-pink-700 border border-pink-200 shadow-sm">
              📱 Mobile-Friendly
            </span>
          </motion.div>
        </motion.header>

        {/* Step Indicator moderne */}
        {currentStep !== 'upload' && (
          <motion.div
            className="flex justify-center items-center gap-2 mb-12 max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { key: 'upload', label: 'Upload', icon: '📸' },
              { key: 'generate', label: 'Générer', icon: '✨' },
              { key: 'modify', label: 'Choisir', icon: '🎯' },
              { key: 'chat', label: 'Affiner', icon: '💬' },
              { key: 'final', label: 'Valider', icon: '✅' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-300
                    ${currentStep === step.key || (['chat', 'final'].includes(currentStep) && ['upload', 'generate', 'modify'].includes(step.key)) || (currentStep === 'final' && step.key === 'chat')
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                      : 'bg-white/60 backdrop-blur-lg text-slate-400 border border-slate-200'
                    }
                  `}
                >
                  <span className="text-base">{step.icon}</span>
                  {currentStep === step.key && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 opacity-30"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </div>
                {index < 4 && (
                  <div className="w-8 md:w-12 h-1 mx-1 rounded-full overflow-hidden bg-slate-200">
                    <div
                      className={`h-full transition-all duration-500 bg-gradient-to-r from-indigo-600 to-purple-600 ${
                        (['chat', 'final'].includes(currentStep) && index < 3) || (currentStep === 'final' && index === 3)
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

        {/* Content avec animations */}
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {currentStep === 'upload' && <UploadArea />}

          {currentStep === 'generate' && !isLoading && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.button
                onClick={handleGenerate}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-10 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Générer les images marketing
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
              <p className="mt-4 text-sm text-slate-500">
                L'IA va créer 4 variantes professionnelles
              </p>
            </motion.div>
          )}

          {isLoading && <LoadingSpinner text="Génération des images en cours..." />}

          {currentStep === 'modify' && <ImageGrid />}

          {currentStep === 'chat' && <ChatModification />}

          {currentStep === 'final' && <FinalCard />}

          {/* Reset Button moderne */}
          {currentStep !== 'upload' && currentStep !== 'final' && currentStep !== 'chat' && (
            <motion.div
              className="text-center pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={reset}
                className="group px-6 py-3 text-slate-600 hover:text-indigo-600 font-medium rounded-xl hover:bg-white/60 hover:backdrop-blur-lg transition-all duration-300 border border-transparent hover:border-indigo-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recommencer avec une nouvelle image
                </span>
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
