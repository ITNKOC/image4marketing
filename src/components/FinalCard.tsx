'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useImageStore } from '@/store/image-store';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function FinalCard() {
  const selectedImage = useImageStore((state) => state.selectedImage);
  const sessionId = useImageStore((state) => state.sessionId);
  const reset = useImageStore((state) => state.reset);
  const [isValidating, setIsValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  if (!selectedImage) {
    return null;
  }

  const handleValidate = async () => {
    if (!sessionId) {
      toast.error('Session non trouvée');
      return;
    }

    setIsValidating(true);

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          finalImageId: selectedImage.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Erreur lors de la validation');
      }

      const data = await response.json();
      setValidated(true);
      setShareUrl(data.shareUrl);
      toast.success('Image validée avec succès !');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = selectedImage.url;
    link.download = `image-marketing-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Téléchargement démarré !');
  };

  const handleShare = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Lien copié dans le presse-papier !');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
          <h2 className="text-3xl font-display font-bold text-white">
            Votre image finale
          </h2>
          <p className="text-primary-100 mt-2">
            Prévisualisation haute résolution
          </p>
        </div>

        {/* Image */}
        <div className="p-8">
          <div className="relative w-full h-[500px] rounded-xl overflow-hidden bg-slate-100 mb-6">
            <Image
              src={selectedImage.url}
              alt="Image finale"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Metadata */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Détails de l'image
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-slate-600">ID:</span>
                <span className="ml-2 text-sm text-slate-800">{selectedImage.id}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600">Créée le:</span>
                <span className="ml-2 text-sm text-slate-800">
                  {new Date(selectedImage.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600">Prompt:</span>
                <p className="mt-1 text-sm text-slate-800 bg-white p-3 rounded border border-slate-200">
                  {selectedImage.prompt}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {!validated ? (
              <>
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="w-full px-6 py-4 bg-green-600 text-white text-lg font-medium rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Validation en cours...
                    </>
                  ) : (
                    <>
                      ✓ Valider cette image
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
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
                  </button>
                  <button
                    onClick={reset}
                    className="px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    Recommencer
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 font-medium mb-2">
                    ✓ Image validée avec succès !
                  </p>
                  <p className="text-green-600 text-sm">
                    Vous pouvez maintenant la télécharger ou la partager
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
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
                  </button>
                  <button
                    onClick={handleShare}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Partager
                  </button>
                  <button
                    onClick={reset}
                    className="px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    Nouvelle
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
