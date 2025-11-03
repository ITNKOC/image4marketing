'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImageStore } from '@/store/image-store';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface ModifyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: string;
  imageUrl: string;
  currentPrompt: string;
}

const PROMPT_SUGGESTIONS = [
  'ajouter des herbes fraîches',
  'fond noir minimaliste',
  'lumière naturelle douce',
  'style magazine culinaire',
  'ingrédients visibles autour',
  'ambiance chaleureuse',
];

export default function ModifyDialog({
  isOpen,
  onClose,
  imageId,
  imageUrl,
  currentPrompt,
}: ModifyDialogProps) {
  const [userPrompt, setUserPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const sessionId = useImageStore((state) => state.sessionId);
  const updateImage = useImageStore((state) => state.updateImage);

  const handleRegenerate = async () => {
    if (userPrompt.trim().length < 10) {
      toast.error('Le prompt doit faire au moins 10 caractères');
      return;
    }

    if (!sessionId) {
      toast.error('Session non trouvée');
      return;
    }

    setIsRegenerating(true);

    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          imageId,
          userPrompt: userPrompt.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Erreur lors de la régénération');
      }

      const data = await response.json();
      updateImage(imageId, data.newImageUrl, data.newPrompt);
      toast.success('Image régénérée avec succès !');
      onClose();
      setUserPrompt('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(errorMessage);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUserPrompt((prev) => (prev ? `${prev}, ${suggestion}` : suggestion));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl border-2 border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-black">
                    Modifier l'image
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 smooth-transition"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                {/* Image Preview */}
                <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6 bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt="Image à modifier"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Current Prompt */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black mb-2">
                    Prompt actuel
                  </label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {currentPrompt}
                  </p>
                </div>

                {/* User Prompt Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black mb-2">
                    Vos modifications (minimum 10 caractères)
                  </label>
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Ex: ajouter plus de lumière, fond sombre, style minimaliste..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black resize-none"
                  />
                </div>

                {/* Prompt Suggestions */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black mb-3">
                    Suggestions rapides
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROMPT_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isRegenerating}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-black rounded-full hover:bg-gray-200 smooth-transition disabled:opacity-50"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isRegenerating}
                    className="flex-1 px-6 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 smooth-transition disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating || userPrompt.trim().length < 10}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRegenerating ? 'Régénération...' : 'Régénérer'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
