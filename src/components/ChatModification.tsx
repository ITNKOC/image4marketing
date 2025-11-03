'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImageStore } from '@/store/image-store';
import toast from 'react-hot-toast';
import Image from 'next/image';
import type { ChatMessage } from '@/types';

const PROMPT_SUGGESTIONS = [
  'ajouter des herbes fraîches',
  'fond noir minimaliste',
  'lumière naturelle douce',
  'style magazine culinaire',
  'ingrédients visibles autour',
  'ambiance chaleureuse',
  'plus de contraste',
  'effet bokeh en arrière-plan',
];

export default function ChatModification() {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const selectedImage = useImageStore((state) => state.selectedImage);
  const sessionId = useImageStore((state) => state.sessionId);
  const chatHistory = useImageStore((state) => state.chatHistory);
  const addChatMessage = useImageStore((state) => state.addChatMessage);
  const updateImage = useImageStore((state) => state.updateImage);
  const selectImageForFinal = useImageStore((state) => state.selectImageForFinal);
  const setLoading = useImageStore((state) => state.setLoading);

  // Auto-scroll vers le bas lors de nouveaux messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  if (!selectedImage) {
    return null;
  }

  const handleSendMessage = async () => {
    const message = inputValue.trim();

    if (message.length < 5) {
      toast.error('Décrivez vos modifications (minimum 5 caractères)');
      return;
    }

    if (!sessionId) {
      toast.error('Session non trouvée');
      return;
    }

    // Ajouter le message de l'utilisateur
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMessage);
    setInputValue('');
    setIsProcessing(true);
    setLoading(true);

    try {
      // Appel API pour régénérer
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          imageId: selectedImage.id,
          userPrompt: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Erreur lors de la modification');
      }

      const data = await response.json();

      // Mettre à jour l'image
      updateImage(selectedImage.id, data.newImageUrl, data.newPrompt);

      // Ajouter la réponse de l'assistant avec la nouvelle image
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: 'Image modifiée avec succès ! Voici le résultat :',
        imageUrl: data.newImageUrl,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(assistantMessage);

      toast.success('Image modifiée !');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(errorMessage);

      // Ajouter un message d'erreur dans le chat
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Désolé, une erreur s'est produite : ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(errorMsg);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleValidate = () => {
    if (selectedImage) {
      selectImageForFinal(selectedImage.id);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-black px-6 py-4">
          <h2 className="text-2xl font-bold text-white">
            🎨 Modification Interactive
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            Continuez à affiner votre image avec des instructions
          </p>
        </div>

        {/* Chat Container */}
        <div
          ref={chatContainerRef}
          className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50"
        >
          <AnimatePresence>
            {chatHistory.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-white text-black border border-gray-200'
                  } rounded-2xl p-4`}
                >
                  {/* Image si présente */}
                  {msg.imageUrl && (
                    <div className="relative w-full h-64 rounded-lg overflow-hidden mb-3 bg-gray-100">
                      <Image
                        src={msg.imageUrl}
                        alt="Image modifiée"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Contenu du message */}
                  <p className="text-sm leading-relaxed">{msg.content}</p>

                  {/* Timestamp */}
                  <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-gray-300' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white text-black rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <motion.div
                      className="w-2 h-2 bg-black rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-800 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-gray-600 rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">Modification en cours...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Suggestions rapides */}
        <div className="px-6 py-3 bg-white border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">Suggestions rapides :</p>
          <div className="flex flex-wrap gap-2">
            {PROMPT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs bg-gray-100 text-black rounded-full hover:bg-gray-200 smooth-transition disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isProcessing) {
                  handleSendMessage();
                }
              }}
              placeholder="Décrivez les modifications souhaitées..."
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50 disabled:bg-gray-100"
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={isProcessing || inputValue.trim().length < 5}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Envoyer
            </motion.button>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-3">
            <motion.button
              onClick={handleValidate}
              disabled={isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 smooth-transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Valider et continuer
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
