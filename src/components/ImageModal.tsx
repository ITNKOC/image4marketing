'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ImageData {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
  sessionId: string;
  user: {
    id: string;
    username: string;
  };
}

interface SocialContent {
  title: string;
  caption: string;
  hashtags: string[];
}

interface ImageModalProps {
  image: ImageData;
  onClose: () => void;
  onDelete: (imageId: string) => void;
  currentUserId?: string;
}

export default function ImageModal({
  image,
  onClose,
  onDelete,
  currentUserId,
}: ImageModalProps) {
  const [socialContent, setSocialContent] = useState<SocialContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSocialContent, setShowSocialContent] = useState(false);
  const [userDescription, setUserDescription] = useState('');
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);

  const isOwner = currentUserId === image.user.id;

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${image.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image téléchargée avec succès!');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
    }
  };

  const handleDelete = async () => {
    if (!isOwner) {
      toast.error('Vous ne pouvez supprimer que vos propres images');
      return;
    }

    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer cette image? Cette action est irréversible.'
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/images/delete?id=${image.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast.success('Image supprimée avec succès!');
      onDelete(image.id);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la suppression'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateSocial = async () => {
    try {
      setIsGenerating(true);
      setShowSocialContent(true);

      const response = await fetch('/api/images/generate-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: image.url,
          userDescription: userDescription.trim() || undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      const data = await response.json();
      setSocialContent(data.content);
      toast.success('Contenu généré avec succès!');
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la génération du contenu'
      );
      setShowSocialContent(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papier!`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex flex-col lg:flex-row max-h-[90vh]">
            {/* Left Side - Image */}
            <div className="lg:w-2/3 relative bg-gray-50 flex items-center justify-center p-8">
              <div className="relative w-full h-[400px] lg:h-[600px]">
                <Image
                  src={image.url}
                  alt={image.prompt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              </div>

              {/* Image Info Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-lg p-4 border border-gray-200">
                <p className="text-black text-sm mb-2 line-clamp-2 font-medium">
                  {image.prompt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Par: {image.user.username}</span>
                  <span>{new Date(image.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>

            {/* Right Side - Actions & Social Content */}
            <div className="lg:w-1/3 flex flex-col overflow-y-auto border-l border-gray-200">
              {/* Actions Panel */}
              <div className="p-6 space-y-3 border-b border-gray-200">
                <h3 className="text-black font-semibold text-lg mb-4">Actions</h3>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  Télécharger
                </button>

                {/* Description Input Toggle */}
                {!showDescriptionInput ? (
                  <button
                    onClick={() => setShowDescriptionInput(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors font-medium text-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Ajouter une description (optionnel)
                  </button>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">
                      Description de l'image (pour guider l'IA)
                    </label>
                    <textarea
                      value={userDescription}
                      onChange={(e) => setUserDescription(e.target.value)}
                      placeholder="Ex: Pizza margherita avec basilic frais, Pizza Napolitaine authentique, Salade César maison..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    />
                    <button
                      onClick={() => {
                        setShowDescriptionInput(false);
                        setUserDescription('');
                      }}
                      className="text-xs text-gray-600 hover:text-black transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                )}

                {/* Generate Social Content Button */}
                <button
                  onClick={handleGenerateSocial}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      <span>Génération...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22.5l-.394-1.933a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                        />
                      </svg>
                      Générer Contenu Social
                    </>
                  )}
                </button>

                {/* Delete Button (only for owner) */}
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Suppression...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                        Supprimer
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Social Content Section */}
              {showSocialContent && (
                <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
                  <h3 className="text-black font-semibold text-lg mb-4">
                    Contenu pour les Réseaux Sociaux
                  </h3>

                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mb-4"></div>
                      <p className="text-gray-600 text-sm">
                        Analyse de l'image en cours...
                      </p>
                    </div>
                  ) : socialContent ? (
                    <div className="space-y-4">
                      {/* Title */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Titre
                          </label>
                          <button
                            onClick={() =>
                              copyToClipboard(socialContent.title, 'Titre')
                            }
                            className="text-xs text-gray-600 hover:text-black transition-colors font-medium"
                          >
                            Copier
                          </button>
                        </div>
                        <p className="text-black text-sm font-medium">{socialContent.title}</p>
                      </div>

                      {/* Caption */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <button
                            onClick={() =>
                              copyToClipboard(socialContent.caption, 'Description')
                            }
                            className="text-xs text-gray-600 hover:text-black transition-colors font-medium"
                          >
                            Copier
                          </button>
                        </div>
                        <p className="text-gray-800 text-sm whitespace-pre-wrap">
                          {socialContent.caption}
                        </p>
                      </div>

                      {/* Hashtags */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Hashtags
                          </label>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                socialContent.hashtags.map((h) => `#${h}`).join(' '),
                                'Hashtags'
                              )
                            }
                            className="text-xs text-gray-600 hover:text-black transition-colors font-medium"
                          >
                            Copier
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {socialContent.hashtags.map((hashtag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium"
                            >
                              #{hashtag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Copy All Button */}
                      <button
                        onClick={() => {
                          const fullContent = `${socialContent.title}\n\n${socialContent.caption}\n\n${socialContent.hashtags.map((h) => `#${h}`).join(' ')}`;
                          copyToClipboard(fullContent, 'Contenu complet');
                        }}
                        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg transition-colors text-sm font-medium"
                      >
                        Copier tout le contenu
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
