'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ImageModal from '@/components/ImageModal';
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function GalleryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  useEffect(() => {
    fetchAllImages(1);
  }, []);

  const fetchAllImages = async (page: number) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(`/api/images/all?page=${page}&limit=20`);

      if (response.status === 401) {
        // Non authentifié, rediriger vers la page de connexion
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des images');
      }

      const data = await response.json();

      if (page === 1) {
        setImages(data.images);
      } else {
        setImages((prev) => [...prev, ...data.images]);
      }

      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchAllImages(pagination.page + 1);
    }
  };

  const handleImageClick = (image: ImageData) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleDeleteImage = (imageId: string) => {
    // Retirer l'image de la liste
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
  };

  // Gestion de la sélection
  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedImages(new Set(images.map((img) => img.id)));
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      deselectAll();
    }
  };

  // Téléchargement en masse
  const handleBulkDownload = async () => {
    if (selectedImages.size === 0) return;

    try {
      setIsBulkDownloading(true);
      const imageIds = Array.from(selectedImages);

      const response = await fetch('/api/images/bulk-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `images-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${selectedImages.size} image${selectedImages.size > 1 ? 's' : ''} téléchargée${selectedImages.size > 1 ? 's' : ''}!`);
      deselectAll();
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  // Suppression en masse
  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedImages.size} image${selectedImages.size > 1 ? 's' : ''}? Cette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      setIsBulkDeleting(true);
      const imageIds = Array.from(selectedImages);

      const response = await fetch('/api/images/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Retirer les images supprimées de la liste
      setImages((prev) => prev.filter((img) => !selectedImages.has(img.id)));
      setPagination((prev) => ({ ...prev, total: prev.total - selectedImages.size }));

      toast.success(`${selectedImages.size} image${selectedImages.size > 1 ? 's' : ''} supprimée${selectedImages.size > 1 ? 's' : ''}!`);
      deselectAll();
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black mx-auto"></div>
          <p className="text-gray-700 mt-4 font-medium">Chargement de la galerie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl font-medium">{error}</p>
          <button
            onClick={() => fetchAllImages(1)}
            className="mt-4 px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-black text-center mb-2">
            Galerie Publique
          </h1>
          <p className="text-gray-600 text-center text-lg">
            Découvrez toutes les images créées par la communauté
          </p>
          <p className="text-gray-500 text-center text-sm mt-2">
            {pagination.total} image{pagination.total > 1 ? 's' : ''} au total
            {images.length < pagination.total && ` • ${images.length} chargée${images.length > 1 ? 's' : ''}`}
          </p>
        </motion.div>

        {/* Barre d'actions */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <button
            onClick={toggleSelectionMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSelectionMode
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {isSelectionMode ? '✓ Mode sélection' : 'Sélectionner'}
          </button>

          {isSelectionMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Tout sélectionner
              </button>
              <button
                onClick={deselectAll}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Tout désélectionner
              </button>
              <span className="text-sm text-gray-600 ml-2">
                {selectedImages.size} sélectionnée{selectedImages.size > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-xl">Aucune image disponible pour le moment</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => isSelectionMode ? toggleImageSelection(image.id) : handleImageClick(image)}
                className={`group relative bg-white border-2 rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer ${
                  selectedImages.has(image.id)
                    ? 'border-black ring-4 ring-black ring-opacity-20'
                    : 'border-gray-200 hover:border-black'
                }`}
              >
                <div className="relative aspect-square">
                  <Image
                    src={image.url}
                    alt={image.prompt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-sm line-clamp-2 mb-2 font-medium">
                        {image.prompt}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-200">
                          Par: {image.user.username}
                        </span>
                        <span className="text-gray-300">
                          {new Date(image.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkbox en mode sélection */}
                {isSelectionMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <div
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        selectedImages.has(image.id)
                          ? 'bg-black border-black'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {selectedImages.has(image.id) && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                          className="w-4 h-4 text-white"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* Badge utilisateur visible sans hover */}
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-medium">
                    {image.user.username}
                  </span>
                </div>

                {/* Icône "Cliquer pour voir" visible au hover (si pas en mode sélection) */}
                {!isSelectionMode && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-sm p-4 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-8 h-8 text-white"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                      />
                    </svg>
                  </div>
                  </div>
                )}
              </motion.div>
              ))}
            </div>

            {/* Bouton Charger Plus */}
            {pagination.hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      <span>Chargement...</span>
                    </>
                  ) : (
                    <>
                      <span>Charger plus</span>
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
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal d'image */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={handleCloseModal}
          onDelete={handleDeleteImage}
          currentUserId={session?.user?.id}
        />
      )}

      {/* Barre d'actions flottante */}
      <AnimatePresence>
        {selectedImages.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-black text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
              <span className="font-medium">
                {selectedImages.size} sélectionnée{selectedImages.size > 1 ? 's' : ''}
              </span>

              <div className="h-6 w-px bg-white/20"></div>

              <button
                onClick={handleBulkDownload}
                disabled={isBulkDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isBulkDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                    <span>Téléchargement...</span>
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
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    <span>Télécharger ZIP</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-red-800 disabled:cursor-not-allowed"
              >
                {isBulkDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
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
                    <span>Supprimer</span>
                  </>
                )}
              </button>

              <button
                onClick={deselectAll}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Annuler la sélection"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
