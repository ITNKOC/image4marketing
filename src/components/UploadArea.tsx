'use client';

import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileSchema } from '@/lib/zod-schemas';
import { useImageStore } from '@/store/image-store';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function UploadArea() {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const setUploadedImage = useImageStore((state) => state.setUploadedImage);
  const setError = useImageStore((state) => state.setError);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validation Zod côté client
    const validation = uploadFileSchema.safeParse({ file });

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message ?? 'Fichier invalide';
      toast.error(errorMessage);
      setError(errorMessage);
      return;
    }

    // Prévisualisation immédiate
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload du fichier
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Erreur lors de l\'upload');
      }

      const data = await response.json();

      setUploadedImage({
        uploadId: data.uploadId,
        url: data.imageUrl,
        metadata: data.metadata,
      });

      toast.success('Image uploadée avec succès !');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(errorMessage);
      setError(errorMessage);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraButtonClick = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Zone de drag & drop moderne */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative rounded-3xl p-8 md:p-12 text-center
            transition-all duration-300 ease-in-out
            ${isDragging
              ? 'bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 scale-105 border-2 border-indigo-500 shadow-2xl'
              : 'bg-white/70 backdrop-blur-xl border-2 border-slate-200 hover:border-indigo-300 shadow-xl hover:shadow-2xl'
            }
            ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-default'}
          `}
        >
          <AnimatePresence mode="wait">
            {preview ? (
              // Prévisualisation avec bouton de changement
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner">
                  <Image
                    src={preview}
                    alt="Prévisualisation"
                    fill
                    className="object-contain p-4"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-white text-center">
                        <svg className="animate-spin h-12 w-12 mx-auto mb-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="font-semibold">Upload en cours...</p>
                      </div>
                    </div>
                  )}
                </div>

                {!uploading && (
                  <motion.button
                    onClick={handleFileButtonClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    Changer l'image
                  </motion.button>
                )}
              </motion.div>
            ) : (
              // Zone d'upload initiale
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {/* Icône moderne */}
                <motion.div
                  className="mx-auto w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center"
                  animate={isDragging ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                >
                  <svg
                    className="w-12 h-12 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </motion.div>

                {/* Texte principal */}
                <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-800 mb-3">
                  {isDragging ? 'Déposez votre image ici !' : 'Uploadez votre photo de plat'}
                </h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  Glissez-déposez une image ou utilisez les boutons ci-dessous
                </p>

                {/* Boutons d'action modernes */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                  <motion.button
                    onClick={handleFileButtonClick}
                    disabled={uploading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      Choisir un fichier
                    </span>
                  </motion.button>

                  {/* Bouton caméra (mobile uniquement) */}
                  {isMobile && (
                    <motion.button
                      onClick={handleCameraButtonClick}
                      disabled={uploading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Prendre une photo
                      </span>
                    </motion.button>
                  )}
                </div>

                {/* Formats acceptés */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-slate-600 border border-slate-200">
                    📸 JPEG
                  </span>
                  <span className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-slate-600 border border-slate-200">
                    🖼️ PNG
                  </span>
                  <span className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-slate-600 border border-slate-200">
                    ✨ WebP
                  </span>
                  <span className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-slate-600 border border-slate-200">
                    📏 Max 10MB
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input caché pour sélectionneur de fichier classique */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />

          {/* Input caché pour caméra mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Info bonus */}
        <motion.p
          className="text-center mt-6 text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          💡 Conseil : Prenez une photo bien éclairée pour de meilleurs résultats
        </motion.p>
      </motion.div>
    </div>
  );
}
